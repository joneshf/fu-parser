import { Image, Token, isStringToken } from "../lexers/token";
import {
	Accuracy,
	DamageType,
	Handed,
	Parser,
	Distance,
	accuracy,
	alt,
	cost,
	damage,
	damageType,
	description,
	eof,
	fmap,
	hands,
	image,
	kl,
	kr,
	many1,
	martial,
	melee,
	sep,
	seq,
	starting,
	str,
	text,
	then,
	WeaponCategory,
	fail,
	nextToken,
	success,
	inc,
} from "./lib";

export type Weapon = {
	image: Image;
	name: string;
	martial: boolean;
	cost: number;
	damage: number;
	accuracy: Accuracy;
	damageType: DamageType;
	hands: Handed;
	melee: Distance;
	category: WeaponCategory;
	description: string;
};

const weaponListingParser = fmap(
	seq(image, str, martial, cost, accuracy, damage, damageType, kl(hands, sep), kl(melee, sep), description),
	([image, name, martial, cost, accuracy, damage, damageType, hands, melee, description]) => {
		return { image, name, martial, cost, damage, accuracy, damageType, hands, melee, description };
	},
);

const advancedStarting: Parser<WeaponCategory> = kl(
	kr(seq(image, image, many1(str)), (ptr) => {
		const token = nextToken(ptr);
		if (token && isStringToken(token) && /^SAMPLE RARE .* WEAPONS$/.test(token.string)) {
			return asWeaponCategory(token.string.slice(12, -8), ptr);
		}
		return fail<WeaponCategory>("Category")(ptr);
	}),
	many1(str),
);

function asWeaponCategory(s: string, ptr: [Token[], number]) {
	switch (s) {
		case "Arcane":
		case "ARCANE":
			return success("arcane" as const)(inc(ptr));
		case "Bow":
		case "BOW":
			return success("bow" as const)(inc(ptr));
		case "Brawling":
		case "BRAWLING":
			return success("brawling" as const)(inc(ptr));
		case "Dagger":
		case "DAGGER":
			return success("dagger" as const)(inc(ptr));
		case "Firearm":
		case "FIREARM":
			return success("firearm" as const)(inc(ptr));
		case "Flail":
		case "FLAIL":
			return success("flail" as const)(inc(ptr));
		case "Heavy":
		case "HEAVY":
			return success("heavy" as const)(inc(ptr));
		case "Spear":
		case "SPEAR":
			return success("spear" as const)(inc(ptr));
		case "Sword":
		case "SWORD":
			return success("sword" as const)(inc(ptr));
		case "Thrown":
		case "THROWN":
			return success("thrown" as const)(inc(ptr));
		default:
			return fail<WeaponCategory>(`Unexpected category ${s}`)(ptr);
	}
}

const categoryTitle: Parser<WeaponCategory> = (ptr) => {
	const token = nextToken(ptr);
	if (token && isStringToken(token) && token.string.endsWith(" Category")) {
		return asWeaponCategory(token.string.slice(0, -9), ptr);
	}
	return fail<WeaponCategory>("Category")(ptr);
};
const weaponsParser = fmap(then(categoryTitle, many1(weaponListingParser)), ([category, weapons]) =>
	weapons.map((v) => {
		return { ...v, category };
	}),
);
const ending = then(alt(then(text("BASIC WEAPONS"), str), str), eof);

export const basicWeapons: Parser<Weapon[]> = fmap(kl(kr(starting, many1(weaponsParser)), ending), (k) => k.flat(1));
export const rareWeapons: Parser<Weapon[]> = kl(
	fmap(then(advancedStarting, many1(weaponListingParser)), ([category, weapons]) =>
		weapons.map((v) => {
			return { ...v, category };
		}),
	),
	then(str, eof),
);
