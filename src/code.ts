import figmaSourceImplementationSkill from "../skills/figma-source-implementation/SKILL.md";

const VERSION = "0.2.0";

type Scope = "selection" | "page" | "file";

type ExportOptions = {
  scope: Scope;
  fileName?: string;
  exportReferenceFrames: boolean;
  referenceScale: 1 | 2;
  exportSvgs: boolean;
  exportImageFills: boolean;
  exportVariables: boolean;
  exportStyles: boolean;
  exportComponents: boolean;
  exportFonts: boolean;
};

type UIMessage =
  | ({ type: "export" } & Partial<ExportOptions>)
  | { type: "cancel-export" }
  | { type: "resize"; height: number }
  | { type: "download-complete"; notify?: string };

type OutputFile = {
  path: string;
  text?: string;
  bytes?: Uint8Array;
  mime: string;
};

type PageExport = {
  id: string;
  name: string;
  path: string;
  rootNodeIds: string[];
};

type FrameReference = {
  nodeId: string;
  nodeName: string;
  pageId: string;
  pageName: string;
  width?: number;
  height?: number;
  path: string;
  scale: number;
  hints: {
    theme: "light" | "dark" | "unknown";
    viewport: "mobile" | "tablet" | "desktop" | "unknown";
    inferredFrom: string[];
  };
};

type AssetMap = {
  imageFills: Record<string, { path: string; mime: string }>;
  svgs: Record<string, { path: string; name: string; pageName: string }>;
  frameReferences: Record<string, { path: string; scale: number }>;
};

type BrokenRecord = {
  nodeId?: string;
  nodeName?: string;
  stage: string;
  message: string;
};

let cancelled = false;

class CancelledError extends Error {
  constructor() {
    super("Export cancelled");
  }
}

function checkCancelled(): void {
  if (cancelled) throw new CancelledError();
}

function postProgress(label: string, current?: number, total?: number): void {
  figma.ui.postMessage({ type: "progress", label, current, total });
}

function safeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "untitled";
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function defaultFileName(): string {
  const root = safeSlug(figma.root.name || "figma-source");
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${root}-source-${stamp}`;
}

function jsonFile(path: string, value: unknown): OutputFile {
  return {
    path,
    text: `${JSON.stringify(value, null, 2)}\n`,
    mime: "application/json",
  };
}

function textFile(path: string, text: string, mime = "text/plain"): OutputFile {
  return { path, text, mime };
}

function plain(value: unknown): unknown {
  if (typeof value === "symbol") return "MIXED";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (typeof child === "function") continue;
      out[key] = plain(child);
    }
    return out;
  }
  return value;
}

function rgba(value: RGB | RGBA): Record<string, number> {
  return {
    r: value.r,
    g: value.g,
    b: value.b,
    a: "a" in value ? value.a : 1,
  };
}

function serializePaint(paint: Paint): Record<string, unknown> {
  const out: Record<string, unknown> = {
    type: paint.type,
    visible: paint.visible ?? true,
    opacity: paint.opacity ?? 1,
    blendMode: paint.blendMode,
  };

  if (paint.type === "SOLID") out.color = rgba(paint.color);
  if (paint.type.startsWith("GRADIENT_")) {
    const gradient = paint as GradientPaint;
    out.gradientStops = gradient.gradientStops.map((stop) => ({
      position: stop.position,
      color: rgba(stop.color),
    }));
    out.gradientTransform = plain(gradient.gradientTransform);
  }
  if (paint.type === "IMAGE") {
    out.scaleMode = paint.scaleMode;
    out.imageRef = paint.imageHash;
    out.imageTransform = plain(paint.imageTransform);
    out.scalingFactor = paint.scalingFactor;
    out.rotation = paint.rotation;
  }

  return out;
}

function serializePaintList(value: readonly Paint[] | PluginAPI["mixed"]): unknown {
  if (value === figma.mixed) return "MIXED";
  return value.map(serializePaint);
}

function serializeEffects(value: readonly Effect[] | PluginAPI["mixed"]): unknown {
  if (value === figma.mixed) return "MIXED";
  return value.map((effect) => plain(effect));
}

function serializeBox(node: SceneNode): Record<string, number> | undefined {
  if (!("absoluteBoundingBox" in node)) return undefined;
  const box = (node as FrameNode).absoluteBoundingBox;
  if (!box) return undefined;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

function serializeRenderBox(node: SceneNode): Record<string, number> | undefined {
  if (!("absoluteRenderBounds" in node)) return undefined;
  const box = (node as FrameNode).absoluteRenderBounds;
  if (!box) return undefined;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

function readProp(node: SceneNode, key: string): unknown {
  try {
    return (node as unknown as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

function addProp(out: Record<string, unknown>, node: SceneNode, key: string): void {
  const value = readProp(node, key);
  if (value === undefined || typeof value === "function") return;
  out[key] = plain(value);
}

function collectImageRefsFromPaints(value: unknown, imageRefs: Set<string>): void {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "IMAGE" && typeof record.imageRef === "string") {
      imageRefs.add(record.imageRef);
    }
  }
}

async function serializeNode(
  node: SceneNode,
  imageRefs: Set<string>,
  errors: BrokenRecord[],
): Promise<Record<string, unknown>> {
  checkCancelled();
  const out: Record<string, unknown> = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
  };

  try {
    const box = serializeBox(node);
    if (box) out.absoluteBoundingBox = box;
    const renderBox = serializeRenderBox(node);
    if (renderBox) out.absoluteRenderBounds = renderBox;

    const commonProps = [
      "opacity",
      "blendMode",
      "isMask",
      "clipsContent",
      "rotation",
      "cornerRadius",
      "topLeftRadius",
      "topRightRadius",
      "bottomLeftRadius",
      "bottomRightRadius",
      "strokeWeight",
      "strokeAlign",
      "strokeCap",
      "strokeJoin",
      "dashPattern",
      "constraints",
      "layoutAlign",
      "layoutGrow",
      "layoutPositioning",
      "layoutMode",
      "layoutWrap",
      "primaryAxisSizingMode",
      "counterAxisSizingMode",
      "primaryAxisAlignItems",
      "counterAxisAlignItems",
      "counterAxisAlignContent",
      "itemSpacing",
      "counterAxisSpacing",
      "paddingLeft",
      "paddingRight",
      "paddingTop",
      "paddingBottom",
      "minWidth",
      "maxWidth",
      "minHeight",
      "maxHeight",
      "overflowDirection",
      "numberOfFixedChildren",
      "itemReverseZIndex",
      "strokesIncludedInLayout",
      "gridStyleId",
      "fillStyleId",
      "strokeStyleId",
      "effectStyleId",
      "textStyleId",
      "componentId",
      "variantProperties",
      "componentProperties",
      "componentPropertyDefinitions",
    ];
    for (const key of commonProps) addProp(out, node, key);

    if ("fills" in node) {
      const fills = serializePaintList(node.fills);
      out.fills = fills;
      collectImageRefsFromPaints(fills, imageRefs);
    }
    if ("strokes" in node) out.strokes = serializePaintList(node.strokes);
    if ("effects" in node) out.effects = serializeEffects(node.effects);
    if ("layoutGrids" in node) out.layoutGrids = plain(node.layoutGrids);

    if (node.type === "TEXT") {
      const text = node as TextNode;
      out.characters = text.characters;
      out.fontName = plain(text.fontName);
      out.fontSize = plain(text.fontSize);
      out.fontWeight = plain(text.fontWeight);
      out.textCase = plain(text.textCase);
      out.textDecoration = plain(text.textDecoration);
      out.textAlignHorizontal = text.textAlignHorizontal;
      out.textAlignVertical = text.textAlignVertical;
      out.lineHeight = plain(text.lineHeight);
      out.letterSpacing = plain(text.letterSpacing);
      out.paragraphSpacing = text.paragraphSpacing;
      out.paragraphIndent = text.paragraphIndent;
      out.autoRename = text.autoRename;
    }

    if ("children" in node) {
      const children: Record<string, unknown>[] = [];
      for (const child of node.children) {
        try {
          children.push(await serializeNode(child, imageRefs, errors));
        } catch (error) {
          if (error instanceof CancelledError) throw error;
          errors.push({
            nodeId: child.id,
            nodeName: child.name,
            stage: "serialize-child",
            message: error instanceof Error ? error.message : String(error),
          });
          children.push({ id: child.id, name: child.name, type: child.type, exportError: true });
        }
      }
      out.children = children;
    }
  } catch (error) {
    if (error instanceof CancelledError) throw error;
    errors.push({
      nodeId: node.id,
      nodeName: node.name,
      stage: "serialize-node",
      message: error instanceof Error ? error.message : String(error),
    });
    out.exportError = true;
  }

  return out;
}

function pageOf(node: BaseNode): PageNode | null {
  let cursor: BaseNode | null = node;
  while (cursor) {
    if (cursor.type === "PAGE") return cursor as PageNode;
    cursor = cursor.parent;
  }
  return null;
}

async function pagesForScope(scope: Scope): Promise<PageNode[]> {
  if (scope === "file") {
    await figma.loadAllPagesAsync();
    return Array.from(figma.root.children);
  }
  return [figma.currentPage];
}

function rootsForPage(page: PageNode, scope: Scope): readonly SceneNode[] {
  if (scope === "selection") {
    return page.id === figma.currentPage.id ? figma.currentPage.selection : [];
  }
  return page.children as readonly SceneNode[];
}

function frameLike(node: SceneNode): boolean {
  return ["FRAME", "COMPONENT", "INSTANCE", "SECTION", "GROUP"].includes(node.type);
}

function inferFrameHints(node: SceneNode): FrameReference["hints"] {
  const lower = node.name.toLowerCase();
  const box = serializeBox(node);
  const inferredFrom: string[] = [];
  let theme: FrameReference["hints"]["theme"] = "unknown";
  let viewport: FrameReference["hints"]["viewport"] = "unknown";

  if (/\bdark\b|dark mode|night/.test(lower)) {
    theme = "dark";
    inferredFrom.push("name:dark");
  } else if (/\blight\b|light mode/.test(lower)) {
    theme = "light";
    inferredFrom.push("name:light");
  }

  if (/mobile|phone|iphone|android/.test(lower)) {
    viewport = "mobile";
    inferredFrom.push("name:mobile");
  } else if (/tablet|ipad/.test(lower)) {
    viewport = "tablet";
    inferredFrom.push("name:tablet");
  } else if (/desktop|web|1440|1920/.test(lower)) {
    viewport = "desktop";
    inferredFrom.push("name:desktop");
  } else if (box) {
    if (box.width <= 600) {
      viewport = "mobile";
      inferredFrom.push("width<=600");
    } else if (box.width <= 1000) {
      viewport = "tablet";
      inferredFrom.push("width<=1000");
    } else {
      viewport = "desktop";
      inferredFrom.push("width>1000");
    }
  }

  return { theme, viewport, inferredFrom };
}

function collectReferenceNodes(pages: PageNode[], scope: Scope): Array<{ page: PageNode; node: SceneNode }> {
  const refs: Array<{ page: PageNode; node: SceneNode }> = [];
  for (const page of pages) {
    const roots = rootsForPage(page, scope);
    for (const node of roots) {
      if (frameLike(node) && node.visible !== false) refs.push({ page, node });
    }
  }
  return refs;
}

function svgCandidate(node: SceneNode): boolean {
  const box = serializeBox(node);
  if (!box || box.width <= 0 || box.height <= 0 || box.width > 768 || box.height > 768) return false;
  const nameLooksLikeAsset = /(icon|logo|mark|arrow|chevron|caret|close|menu|search|play|pause|social|facebook|instagram|linkedin|twitter|x-icon)/i.test(node.name);
  const vectorPrimitive = ["VECTOR", "BOOLEAN_OPERATION", "STAR", "REGULAR_POLYGON"].includes(node.type);
  return nameLooksLikeAsset || vectorPrimitive;
}

function collectSvgCandidates(roots: readonly SceneNode[]): SceneNode[] {
  const output: SceneNode[] = [];
  const seen = new Set<string>();

  function visit(node: SceneNode): void {
    if (seen.has(node.id) || node.visible === false) return;
    if (svgCandidate(node)) {
      seen.add(node.id);
      output.push(node);
      if (/(icon|logo|mark)/i.test(node.name)) return;
    }
    if ("children" in node) {
      for (const child of node.children) visit(child);
    }
  }

  for (const root of roots) visit(root);
  return output;
}

async function parallelMap<T, R>(items: readonly T[], concurrency: number, work: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (true) {
      checkCancelled();
      const index = nextIndex++;
      if (index >= items.length) return;
      output[index] = await work(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker()));
  return output;
}

function detectImage(bytes: Uint8Array): { extension: string; mime: string } {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { extension: "png", mime: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (bytes.length >= 6 && String.fromCharCode(...Array.from(bytes.slice(0, 6))) .startsWith("GIF8")) {
    return { extension: "gif", mime: "image/gif" };
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...Array.from(bytes.slice(0, 4))) === "RIFF" &&
    String.fromCharCode(...Array.from(bytes.slice(8, 12))) === "WEBP"
  ) {
    return { extension: "webp", mime: "image/webp" };
  }
  return { extension: "bin", mime: "application/octet-stream" };
}

async function exportImageFills(imageRefs: Set<string>, files: OutputFile[], assetMap: AssetMap, errors: BrokenRecord[]): Promise<void> {
  const refs = Array.from(imageRefs);
  postProgress(`Exporting ${refs.length} original image fill(s)…`, 0, refs.length);
  const results = await parallelMap(refs, 6, async (ref, index) => {
    checkCancelled();
    try {
      const image = figma.getImageByHash(ref);
      if (!image) throw new Error("Image hash is not available in this document");
      const bytes = await image.getBytesAsync();
      postProgress(`Original images ${index + 1}/${refs.length}`, index + 1, refs.length);
      return { ref, bytes };
    } catch (error) {
      errors.push({ stage: "image-fill", message: `${ref}: ${error instanceof Error ? error.message : String(error)}` });
      return null;
    }
  });

  for (const result of results) {
    if (!result) continue;
    const format = detectImage(result.bytes);
    const path = `assets/images/${result.ref}.${format.extension}`;
    files.push({ path, bytes: result.bytes, mime: format.mime });
    assetMap.imageFills[result.ref] = { path, mime: format.mime };
  }
}

async function exportSvgs(
  pages: PageNode[],
  scope: Scope,
  files: OutputFile[],
  assetMap: AssetMap,
  errors: BrokenRecord[],
): Promise<void> {
  const candidates: Array<{ page: PageNode; node: SceneNode }> = [];
  const seen = new Set<string>();
  for (const page of pages) {
    for (const node of collectSvgCandidates(rootsForPage(page, scope))) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      candidates.push({ page, node });
    }
  }

  postProgress(`Exporting ${candidates.length} SVG candidate(s)…`, 0, candidates.length);
  const results = await parallelMap(candidates, 5, async (entry, index) => {
    try {
      const svg = await entry.node.exportAsync({ format: "SVG_STRING" });
      postProgress(`SVG ${index + 1}/${candidates.length}`, index + 1, candidates.length);
      return { ...entry, svg };
    } catch (error) {
      errors.push({
        nodeId: entry.node.id,
        nodeName: entry.node.name,
        stage: "svg",
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  });

  for (const result of results) {
    if (!result) continue;
    const pageSlug = safeSlug(result.page.name);
    const filename = `${safeSlug(result.node.name)}__${safeId(result.node.id)}.svg`;
    const path = `assets/svg/${pageSlug}/${filename}`;
    files.push({ path, text: result.svg, mime: "image/svg+xml" });
    assetMap.svgs[result.node.id] = { path, name: result.node.name, pageName: result.page.name };
  }
}

async function exportFrameReferences(
  pages: PageNode[],
  scope: Scope,
  scale: 1 | 2,
  files: OutputFile[],
  assetMap: AssetMap,
  errors: BrokenRecord[],
): Promise<FrameReference[]> {
  const refs = collectReferenceNodes(pages, scope);
  const records: FrameReference[] = [];
  postProgress(`Rendering ${refs.length} reference frame(s) at ${scale}x…`, 0, refs.length);

  const results = await parallelMap(refs, 3, async (entry, index) => {
    try {
      const bytes = await entry.node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: scale },
      });
      postProgress(`Reference frames ${index + 1}/${refs.length}`, index + 1, refs.length);
      return { ...entry, bytes };
    } catch (error) {
      errors.push({
        nodeId: entry.node.id,
        nodeName: entry.node.name,
        stage: "frame-render",
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  });

  for (const result of results) {
    if (!result) continue;
    const pageSlug = safeSlug(result.page.name);
    const filename = `${safeSlug(result.node.name)}__${safeId(result.node.id)}@${scale}x.png`;
    const path = `frames/${pageSlug}/${filename}`;
    const box = serializeBox(result.node);
    files.push({ path, bytes: result.bytes, mime: "image/png" });
    assetMap.frameReferences[result.node.id] = { path, scale };
    records.push({
      nodeId: result.node.id,
      nodeName: result.node.name,
      pageId: result.page.id,
      pageName: result.page.name,
      width: box?.width,
      height: box?.height,
      path,
      scale,
      hints: inferFrameHints(result.node),
    });
  }

  return records;
}

async function exportVariables(files: OutputFile[], errors: BrokenRecord[]): Promise<void> {
  try {
    const [collections, variables] = await Promise.all([
      figma.variables.getLocalVariableCollectionsAsync(),
      figma.variables.getLocalVariablesAsync(),
    ]);

    files.push(
      jsonFile("tokens/variables.json", {
        collections: collections.map((collection) => ({
          id: collection.id,
          key: collection.key,
          name: collection.name,
          modes: plain(collection.modes),
          defaultModeId: collection.defaultModeId,
          variableIds: collection.variableIds,
          remote: collection.remote,
          hiddenFromPublishing: collection.hiddenFromPublishing,
        })),
        variables: variables.map((variable) => ({
          id: variable.id,
          key: variable.key,
          name: variable.name,
          description: variable.description,
          variableCollectionId: variable.variableCollectionId,
          resolvedType: variable.resolvedType,
          valuesByMode: plain(variable.valuesByMode),
          scopes: plain(variable.scopes),
          codeSyntax: plain(variable.codeSyntax),
          remote: variable.remote,
          hiddenFromPublishing: variable.hiddenFromPublishing,
        })),
      }),
    );
  } catch (error) {
    errors.push({ stage: "variables", message: error instanceof Error ? error.message : String(error) });
  }
}

async function exportStyles(files: OutputFile[], errors: BrokenRecord[]): Promise<void> {
  try {
    const [paints, texts, effects, grids] = await Promise.all([
      figma.getLocalPaintStylesAsync(),
      figma.getLocalTextStylesAsync(),
      figma.getLocalEffectStylesAsync(),
      figma.getLocalGridStylesAsync(),
    ]);

    files.push(
      jsonFile("tokens/styles.json", {
        paintStyles: paints.map((style) => ({
          id: style.id,
          key: style.key,
          name: style.name,
          description: style.description,
          paints: style.paints.map(serializePaint),
        })),
        textStyles: texts.map((style) => ({
          id: style.id,
          key: style.key,
          name: style.name,
          description: style.description,
          fontName: plain(style.fontName),
          fontSize: style.fontSize,
          textCase: style.textCase,
          textDecoration: style.textDecoration,
          letterSpacing: plain(style.letterSpacing),
          lineHeight: plain(style.lineHeight),
          paragraphIndent: style.paragraphIndent,
          paragraphSpacing: style.paragraphSpacing,
        })),
        effectStyles: effects.map((style) => ({
          id: style.id,
          key: style.key,
          name: style.name,
          description: style.description,
          effects: plain(style.effects),
        })),
        gridStyles: grids.map((style) => ({
          id: style.id,
          key: style.key,
          name: style.name,
          description: style.description,
          layoutGrids: plain(style.layoutGrids),
        })),
      }),
    );
  } catch (error) {
    errors.push({ stage: "styles", message: error instanceof Error ? error.message : String(error) });
  }
}

async function collectComponents(
  pages: PageNode[],
  scope: Scope,
  files: OutputFile[],
  errors: BrokenRecord[],
): Promise<void> {
  const components: Record<string, unknown>[] = [];
  const componentSets: Record<string, unknown>[] = [];
  const instances: Record<string, unknown>[] = [];
  const externalComponents = new Map<string, Record<string, unknown>>();

  async function visit(node: SceneNode, page: PageNode): Promise<void> {
    checkCancelled();
    try {
      if (node.type === "COMPONENT") {
        const component = node as ComponentNode;
        components.push({
          id: component.id,
          key: component.key,
          name: component.name,
          description: component.description,
          pageId: page.id,
          pageName: page.name,
          componentPropertyDefinitions: plain(component.componentPropertyDefinitions),
        });
      }
      if (node.type === "COMPONENT_SET") {
        const set = node as ComponentSetNode;
        componentSets.push({
          id: set.id,
          key: set.key,
          name: set.name,
          description: set.description,
          pageId: page.id,
          pageName: page.name,
          componentPropertyDefinitions: plain(set.componentPropertyDefinitions),
        });
      }
      if (node.type === "INSTANCE") {
        const instance = node as InstanceNode;
        let main: ComponentNode | null = null;
        try {
          main = await instance.getMainComponentAsync();
        } catch {
          main = null;
        }
        instances.push({
          id: instance.id,
          name: instance.name,
          pageId: page.id,
          pageName: page.name,
          componentId: main?.id ?? null,
          componentProperties: plain(instance.componentProperties),
          variantProperties: plain(instance.variantProperties),
        });
        if (main && !externalComponents.has(main.id)) {
          const mainPage = pageOf(main);
          externalComponents.set(main.id, {
            id: main.id,
            key: main.key,
            name: main.name,
            description: main.description,
            pageId: mainPage?.id ?? null,
            pageName: mainPage?.name ?? null,
            componentPropertyDefinitions: plain(main.componentPropertyDefinitions),
          });
        }
      }
      if ("children" in node) {
        for (const child of node.children) await visit(child, page);
      }
    } catch (error) {
      errors.push({
        nodeId: node.id,
        nodeName: node.name,
        stage: "components",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const page of pages) {
    for (const root of rootsForPage(page, scope)) await visit(root, page);
  }

  files.push(
    jsonFile("components/index.json", {
      components,
      componentSets,
      instances,
      referencedComponents: Array.from(externalComponents.values()),
    }),
  );
}

async function collectFonts(pages: PageNode[], scope: Scope, files: OutputFile[], errors: BrokenRecord[]): Promise<void> {
  const fonts = new Map<string, { family: string; style: string; usedBy: number }>();

  function addFont(font: FontName): void {
    const key = `${font.family}::${font.style}`;
    const existing = fonts.get(key);
    if (existing) existing.usedBy += 1;
    else fonts.set(key, { family: font.family, style: font.style, usedBy: 1 });
  }

  function visit(node: SceneNode): void {
    try {
      if (node.type === "TEXT") {
        const text = node as TextNode;
        if (text.fontName !== figma.mixed) {
          addFont(text.fontName as FontName);
        } else if (text.characters.length > 0) {
          for (const font of text.getRangeAllFontNames(0, text.characters.length)) addFont(font);
        }
      }
      if ("children" in node) for (const child of node.children) visit(child);
    } catch (error) {
      errors.push({
        nodeId: node.id,
        nodeName: node.name,
        stage: "fonts",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const page of pages) for (const root of rootsForPage(page, scope)) visit(root);
  files.push(jsonFile("typography/fonts.json", { fonts: Array.from(fonts.values()).sort((a, b) => a.family.localeCompare(b.family)) }));
}

function skillBody(): string {
  return figmaSourceImplementationSkill
    .replace(/\r\n/g, "\n")
    .replace(/^---\n[\s\S]*?\n---\n?/, "")
    .trim();
}

function agentReadme(scope: Scope): string {
  return `# Coding-agent source pack

This ZIP was generated directly from the open Figma document by Agent Source Exporter v${VERSION}. It is an offline implementation reference and does not require Figma REST/MCP access.

**Export scope:** ${scope}

The operating procedure below is bundled from the repository's canonical \`skills/figma-source-implementation/SKILL.md\`. Follow it before editing application code.

${skillBody()}
`;
}

function sourceMapTemplate(): string {
  return `# Copy this file to source-map.yaml and fill it before implementation.
target:
  page: ""
  frame: ""
  nodeId: ""
  dimensions:
    width: null
    height: null

references:
  visual: ""
  structure: ""
  manifest: "manifest.json"

assets: {}
tokens:
  variables: "tokens/variables.json"
  styles: "tokens/styles.json"
components: "components/index.json"

implementation:
  route: ""
  component: ""
  existingReusableComponents: []

evidence:
  manifestErrorsReviewed: false
  unresolvedGaps: []
  notes: []
`;
}

async function performExport(options: ExportOptions): Promise<void> {
  cancelled = false;
  const startedAt = new Date().toISOString();
  const files: OutputFile[] = [];
  const errors: BrokenRecord[] = [];
  const imageRefs = new Set<string>();
  const assetMap: AssetMap = { imageFills: {}, svgs: {}, frameReferences: {} };

  postProgress("Loading Figma source…");
  const pages = await pagesForScope(options.scope);
  if (options.scope === "selection" && figma.currentPage.selection.length === 0) {
    throw new Error("Select at least one node before exporting Selection.");
  }

  const exportedPages: PageExport[] = [];
  let serializedRootCount = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    checkCancelled();
    const page = pages[pageIndex];
    const roots = rootsForPage(page, options.scope);
    postProgress(`Serializing page ${pageIndex + 1}/${pages.length}: ${page.name}`, pageIndex, pages.length);
    const serializedRoots: Record<string, unknown>[] = [];
    for (const root of roots) {
      serializedRoots.push(await serializeNode(root, imageRefs, errors));
      serializedRootCount += 1;
    }
    const pagePath = `document/pages/${safeSlug(page.name)}__${safeId(page.id)}.json`;
    files.push(
      jsonFile(pagePath, {
        id: page.id,
        name: page.name,
        type: "CANVAS",
        backgrounds: plain(page.backgrounds),
        children: serializedRoots,
      }),
    );
    exportedPages.push({
      id: page.id,
      name: page.name,
      path: pagePath,
      rootNodeIds: roots.map((node) => node.id),
    });
  }

  postProgress("Collecting design-system metadata…");
  if (options.exportVariables) await exportVariables(files, errors);
  if (options.exportStyles) await exportStyles(files, errors);
  if (options.exportComponents) await collectComponents(pages, options.scope, files, errors);
  if (options.exportFonts) await collectFonts(pages, options.scope, files, errors);

  let frameReferences: FrameReference[] = [];
  if (options.exportReferenceFrames) {
    frameReferences = await exportFrameReferences(
      pages,
      options.scope,
      options.referenceScale,
      files,
      assetMap,
      errors,
    );
  }

  if (options.exportSvgs) await exportSvgs(pages, options.scope, files, assetMap, errors);
  if (options.exportImageFills) await exportImageFills(imageRefs, files, assetMap, errors);

  files.push(jsonFile("assets/asset-map.json", assetMap));
  files.push(textFile("agent/README.md", agentReadme(options.scope), "text/markdown"));
  files.push(textFile("agent/source-map.template.yaml", sourceMapTemplate(), "text/yaml"));

  const manifest = {
    schemaVersion: 1,
    exporter: {
      name: "Agent Source Exporter",
      version: VERSION,
    },
    source: {
      fileName: figma.root.name,
      scope: options.scope,
      exportedAt: startedAt,
      currentPageId: figma.currentPage.id,
      currentPageName: figma.currentPage.name,
    },
    options,
    pages: exportedPages,
    frameReferences,
    counts: {
      pages: exportedPages.length,
      serializedRoots: serializedRootCount,
      imageRefs: imageRefs.size,
      frameReferences: frameReferences.length,
      svgAssets: Object.keys(assetMap.svgs).length,
      imageAssets: Object.keys(assetMap.imageFills).length,
      files: files.length + 1,
      errors: errors.length,
    },
    errors,
  };
  files.unshift(jsonFile("manifest.json", manifest));

  const fileName = (options.fileName || defaultFileName()).replace(/\.(zip|json)$/i, "");
  figma.ui.postMessage({
    type: "export-result",
    success: true,
    fileName,
    files,
    summary: manifest.counts,
    errorCount: errors.length,
  });
}

figma.showUI(__html__, { width: 420, height: 760 });

function selectionState(): void {
  figma.ui.postMessage({
    type: "selection-changed",
    count: figma.currentPage.selection.length,
    names: figma.currentPage.selection.map((node) => node.name),
    pageName: figma.currentPage.name,
    fileName: figma.root.name,
    defaultFileName: defaultFileName(),
  });
}

selectionState();
figma.on("selectionchange", selectionState);
figma.on("currentpagechange", selectionState);

figma.ui.onmessage = async (message: UIMessage) => {
  if (message.type === "cancel-export") {
    cancelled = true;
    return;
  }

  if (message.type === "resize") {
    const height = Math.max(500, Math.min(1000, Math.round(message.height)));
    figma.ui.resize(420, height);
    return;
  }

  if (message.type === "download-complete") {
    if (message.notify) figma.notify(message.notify, { timeout: 5000 });
    return;
  }

  if (message.type !== "export") return;

  try {
    const options: ExportOptions = {
      scope: message.scope === "file" || message.scope === "page" ? message.scope : "selection",
      fileName: message.fileName,
      exportReferenceFrames: message.exportReferenceFrames !== false,
      referenceScale: message.referenceScale === 2 ? 2 : 1,
      exportSvgs: message.exportSvgs !== false,
      exportImageFills: message.exportImageFills !== false,
      exportVariables: message.exportVariables !== false,
      exportStyles: message.exportStyles !== false,
      exportComponents: message.exportComponents !== false,
      exportFonts: message.exportFonts !== false,
    };
    await performExport(options);
  } catch (error) {
    if (error instanceof CancelledError) {
      figma.ui.postMessage({ type: "export-cancelled" });
      return;
    }
    figma.ui.postMessage({
      type: "export-result",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
