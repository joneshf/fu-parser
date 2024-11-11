import { Image } from "../lexers/token";
import {
	Parser,
	description,
	eof,
	fmap,
	image,
	kl,
	kr,
	many1,
	matches,
	seq,
	starting,
	str,
	then,
	watermark,
} from "./lib";

type ConsumableListing = { image: Image; name: string; description: string; ipCost: number };

export type Consumable = ConsumableListing & {
	category: string;
};

const consumableListingParser: Parser<ConsumableListing> = fmap(
	seq(
		image,
		fmap(many1(str), (s) => s.join(" ")),
		fmap(matches(/^[0-9]+$/, "ipCost"), (s) => Number(s)),
		description,
	),
	([image, name, ipCost, description]) => {
		return { image, name, ipCost, description };
	},
);

const header = matches(/^[^.?!]*$/, "header");

const consumableParser: Parser<Consumable[]> = fmap(
	then(header, many1(consumableListingParser)),
	([category, consumableListings]: [string, ConsumableListing[]]): Consumable[] => {
		return consumableListings.map((consumableListing: ConsumableListing): Consumable => {
			return { ...consumableListing, category };
		});
	},
);

export const consumablesPage: Parser<Consumable[]> = fmap(
	kl(kr(starting, many1(consumableParser)), seq(str, watermark, eof)),
	(consumables: Consumable[][]): Consumable[] => consumables.flat(1),
);
