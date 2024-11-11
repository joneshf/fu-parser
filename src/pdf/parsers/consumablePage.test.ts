import fc from "fast-check";
import { cost, multiString, word, description } from "../arbs/arbs";
import { isResult, prettifyStrings } from "./lib";
import { Image, Token } from "../lexers/token";
import { imageToken, stringToken, watermark } from "../arbs/output";
import { Consumable, consumablesPage } from "./consumablePage";

const consumableDataGen = fc.array(
	fc.tuple(
		word(),
		fc.array(
			fc.record({
				name: multiString(),
				ipCost: cost(),
				description: description(),
				image: fc.constant({ width: 0, height: 0 } as Image),
			}),
			{ minLength: 1 },
		),
	),
	{ minLength: 1 },
);

test("parses generated", () => {
	fc.assert(
		fc.property(consumableDataGen, (cs): void => {
			const pageTokens: Token[] = [
				imageToken({ width: 0, height: 0 } as Image),
				imageToken({ width: 0, height: 0 } as Image),
				stringToken(""),
				...cs.flatMap(([h, d]) => [
					stringToken(h),
					...d.flatMap((m) => [
						imageToken(m.image),
						...m.name.map((s) => stringToken(s)),
						stringToken(m.ipCost.toString()),
						...m.description.map((s) => stringToken(s, "FBDLWO+PTSans-Narrow")),
					]),
				]),
				stringToken(""),
				watermark,
			];
			const parses = consumablesPage([pageTokens, 0]);
			const expected: Consumable[] = cs.flatMap(([h, vs]): Consumable[] =>
				vs.map((v): Consumable => {
					return { ...v, category: h, description: prettifyStrings(v.description), name: v.name.join(" ") };
				}),
			);
			const successful = parses.filter(isResult);
			for (const p of successful) {
				expect(p.result[0]).toEqual(expected);
			}
			expect(successful.length).toBe(1);
		}),
	);
});
