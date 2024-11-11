import { describe, expect, test } from "@jest/globals";
import fs from "fs";
import { tokenizePDF } from "../lexers/pdf";
import { Parser, isResult } from "./lib";
import { pageContent, PageContent, pageContentParser, PageContentType } from "./fabula-ultima-pdf";

const STANDARD_FONT_DATA_URL = "node_modules/pdfjs-dist/standard_fonts/";
const FABULA_ULTIMA_PDF_PATH = "data/Fabula_Ultima_-_Core_Rulebook.pdf";

const [withPage, destroy] = await tokenizePDF({
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

describe("parses pages", () => {
	for (const [page, content] of pageContent) {
		const f: Parser<PageContentType[typeof content][]> = pageContentParser[content];
		const name: string = pageContentName[content];
		test(`${page} - ${name}`, async () => {
			await withPage(page, async (d) => {
				const successful = f([d, 0]).filter(isResult);
				expect(successful.length).toBe(1);
			});
		});
	}

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
