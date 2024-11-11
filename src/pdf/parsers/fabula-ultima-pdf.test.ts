import { describe, expect, test } from "@jest/globals";
import fs from "fs";
import { Destroy, tokenizePDF, WithPDF } from "../lexers/pdf";
import { Parser, isResult } from "./lib";
import { PageContent, pageContentParser, PageContentType, pdf, PDFName } from "./fabula-ultima-pdf";

const STANDARD_FONT_DATA_URL = "node_modules/pdfjs-dist/standard_fonts/";
const FABULA_ULTIMA_PDF_PATH = "data/Fabula_Ultima_-_Core_Rulebook.pdf";

const tokenizedCoreRulebook: [WithPDF, Destroy] = await tokenizePDF({
	data: new Uint8Array(fs.readFileSync(FABULA_ULTIMA_PDF_PATH)),
	standardFontDataUrl: STANDARD_FONT_DATA_URL,
});

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
	tokenized: [WithPDF, Destroy];
};

describe.each<DescribePDF>([
	{
		name: "Core Rulebook",
		tokenized: tokenizedCoreRulebook,
	},
])("parses pages for $name", (describePDF: DescribePDF): void => {
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
