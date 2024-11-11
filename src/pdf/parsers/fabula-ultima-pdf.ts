import { accessories, Accessory } from "./accessoryPage";
import { Armor, armorPage } from "./armorPage";
import { Beast, beastiary } from "./beastiaryPage";
import { Consumable, consumablesPage } from "./consumablePage";
import { Parser } from "./lib";
import { Shield, shieldPage } from "./shieldPage";
import { basicWeapons, rareWeapons, Weapon } from "./weaponPage";

export type PageContent = (typeof PAGE_CONTENT)[number];

const PAGE_CONTENT = [
	"Accessory",
	"Basic Armor",
	"Basic Shield",
	"Basic Weapon",
	"Bestiary",
	"Consumable",
	"Rare Armor",
	"Rare Shield",
	"Rare Weapon",
] as const;

export type PageContentType = {
	Accessory: Accessory;
	"Basic Armor": Armor;
	"Basic Shield": Shield;
	"Basic Weapon": Weapon;
	Bestiary: Beast;
	Consumable: Consumable;
	"Rare Armor": Armor;
	"Rare Shield": Shield;
	"Rare Weapon": Weapon;
};

const coreRulebookPageContent: Map<number, PageContent> = new Map([
	[106, "Consumable"],
	[132, "Basic Weapon"],
	[133, "Basic Weapon"],
	[134, "Basic Armor"],
	[135, "Basic Shield"],
	[272, "Rare Weapon"],
	[273, "Rare Weapon"],
	[274, "Rare Weapon"],
	[275, "Rare Weapon"],
	[276, "Rare Weapon"],
	[277, "Rare Weapon"],
	[278, "Rare Weapon"],
	[279, "Rare Weapon"],
	[280, "Rare Weapon"],
	[281, "Rare Weapon"],
	[283, "Rare Armor"],
	[284, "Rare Armor"],
	[285, "Rare Shield"],
	[287, "Accessory"],
	[288, "Accessory"],
	[289, "Accessory"],
	[326, "Bestiary"],
	[327, "Bestiary"],
	[328, "Bestiary"],
	[329, "Bestiary"],
	[330, "Bestiary"],
	[331, "Bestiary"],
	[332, "Bestiary"],
	[333, "Bestiary"],
	[334, "Bestiary"],
	[335, "Bestiary"],
	[336, "Bestiary"],
	[337, "Bestiary"],
	[338, "Bestiary"],
	[339, "Bestiary"],
	[340, "Bestiary"],
	[341, "Bestiary"],
	[342, "Bestiary"],
	[343, "Bestiary"],
	[344, "Bestiary"],
	[345, "Bestiary"],
	[346, "Bestiary"],
	[347, "Bestiary"],
	[348, "Bestiary"],
	[349, "Bestiary"],
	[350, "Bestiary"],
	[351, "Bestiary"],
	[352, "Bestiary"],
	[353, "Bestiary"],
	[354, "Bestiary"],
	[355, "Bestiary"],
]);

export const pageContentParser: {
	[pageContent in PageContent]: Parser<PageContentType[pageContent][]>;
} = {
	Accessory: accessories,
	"Basic Armor": armorPage,
	"Basic Shield": shieldPage,
	"Basic Weapon": basicWeapons,
	Bestiary: beastiary,
	Consumable: consumablesPage,
	"Rare Armor": armorPage,
	"Rare Shield": shieldPage,
	"Rare Weapon": rareWeapons,
};

export type PDFName = (typeof PDF_NAME)[number];

const PDF_NAME = ["Core Rulebook", "Core Rulebook 1.02"] as const;

export const pdf: Record<PDFName, Map<number, PageContent>> = {
	"Core Rulebook": coreRulebookPageContent,
	"Core Rulebook 1.02": coreRulebookPageContent,
};
