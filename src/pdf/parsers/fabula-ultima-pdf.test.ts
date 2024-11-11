import { describe, expect, test } from "@jest/globals";
import fs from "fs";
import { Destroy, tokenizePDF, WithPDF } from "../lexers/pdf";
import { Parser, isResult } from "./lib";
import { PageContent, pageContentParser, PageContentType, pdf, PDFName } from "./fabula-ultima-pdf";

const isObject = (x: unknown): x is object => {
	return x != null && typeof x === "object";
};

const isENOENT = (x: unknown): x is { code: "ENOENT" } => {
	return isObject(x) && "code" in x && x.code === "ENOENT";
};

const STANDARD_FONT_DATA_URL = "node_modules/pdfjs-dist/standard_fonts/";

const tokenize = async (filePath: string): Promise<[WithPDF, Destroy] | null> => {
	try {
		return tokenizePDF({
			data: new Uint8Array(fs.readFileSync(filePath)),
			standardFontDataUrl: STANDARD_FONT_DATA_URL,
		});
	} catch (error: unknown) {
		if (!isENOENT(error)) {
			throw error;
		}

		return null;
	}
};

const tokenizedCoreRulebook: [WithPDF, Destroy] | null = await tokenize("data/Fabula_Ultima_-_Core_Rulebook.pdf");
const tokenizedCoreRulebook_1_02: [WithPDF, Destroy] | null = await tokenize(
	"data/Fabula_Ultima_-_Core_Rulebook_1.02.pdf",
);

const pageContentName: Record<PageContent, string> = {
	Accessory: "Accessories",
	"Basic Armor": "Armors - Basic",
	"Basic Shield": "Shields - Basic",
	"Basic Weapon": "Weapons - Basic",
	Bestiary: "Beastiary",
	Consumable: "Consumables",
	"Rare Armor": "Armors - Rare",
	"Rare Shield": "Shields - Rare",
	"Rare Weapon": "Weapons - Rare",
};

type DescribePDF = {
	name: PDFName;
	tokenized: [WithPDF, Destroy] | null;
};

describe.each<DescribePDF>([
	{ name: "Core Rulebook", tokenized: tokenizedCoreRulebook },
	{ name: "Core Rulebook 1.02", tokenized: tokenizedCoreRulebook_1_02 },
])("parses pages for $name", (describePDF: DescribePDF): void => {
	if (describePDF.tokenized == null) {
		return;
	}

	const [withPage, destroy]: [WithPDF, Destroy] = describePDF.tokenized;
	const pageContent: Map<number, PageContent> = pdf[describePDF.name];
	type PageContentWithName = {
		content: PageContent;
		name: string;
		page: number;
	};
	const pageContentWithName: PageContentWithName[] = [...pageContent].map(
		([page, content]: [number, PageContent]): PageContentWithName => {
			return {
				content,
				name: pageContentName[content],
				page,
			};
		},
	);
	test.each(pageContentWithName)(`$page - $name`, async (pageContentWithName: PageContentWithName): Promise<void> => {
		const content: PageContent = pageContentWithName.content;
		const page: number = pageContentWithName.page;
		const f: Parser<PageContentType[typeof content][]> = pageContentParser[content];
		await withPage(page, async (d) => {
			const successful = f([d, 0]).filter(isResult);
			expect(successful.length).toBe(1);
		});
	});

	// test("current", async () => {
	// 	await withPage(350, async (d) => {
	// 		const data = d.map((t) => (isImageToken(t) ? { ...t, image: { ...t.image, data: [] } } : t));
	// 		const parses = beastiary([data, 0]);
	// 		// parses.filter(isError).map((z) => console.log(z.error));
	// 		console.log(data.slice(80));

	// 		expect(parses.filter(isResult).length).toBe(1);
	// 	});
	// });

	afterAll(() => destroy());
});
