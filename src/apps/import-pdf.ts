import * as pdfjsLib from "pdfjs-dist";
import { Affinity, Parser, Stat, isError, isResult } from "../pdf/parsers/lib";
import { Consumable } from "../pdf/parsers/consumablePage";
import { Weapon } from "../pdf/parsers/weaponPage";
import { Armor } from "../pdf/parsers/armorPage";
import { Shield } from "../pdf/parsers/shieldPage";
import { Accessory } from "../pdf/parsers/accessoryPage";
import { Beast } from "../pdf/parsers/beastiaryPage";
import { StringToken, Token } from "../pdf/lexers/token";
import { tokenizePDF } from "../pdf/lexers/pdf";
import { ATTR, FUActor, FUItem, getFolder, saveImage } from "../external/project-fu";
import { PDFName, PageContent, PageContentType, pageContentParser, pdf } from "../pdf/parsers/fabula-ultima-pdf";

// Relative url that foundry serves for the compiled webworker
pdfjsLib.GlobalWorkerOptions.workerSrc = "modules/fu-parser/pdf.worker.js";

// Foundry v10 creates these methods, but pdfjs does not like extra methods on Object that are enumerable,
// so fix the compatibility issue
for (const prop of ["deepFlatten", "equals", "partition", "filterJoin", "findSplice"]) {
	Object.defineProperty(Array.prototype, prop, {
		enumerable: false,
	});
}

type SaveFunction<T> = (t: T[], pn: number, f: readonly string[], imagePath: string) => Promise<void>;

const AFF_MAPPING: Record<Affinity, number> = {
	VU: -1,
	N: 0,
	RS: 1,
	IM: 2,
	AB: 3,
};

const STAT_MAPPING: Record<Stat, ATTR> = {
	DEX: "dex",
	MIG: "mig",
	INS: "ins",
	WLP: "wlp",
};
const saveConsumables: SaveFunction<Consumable> = async (
	consumables: Consumable[],
	pageNum: number,
	folderNames: readonly string[],
	imagePath: string,
) => {
	for (const data of consumables) {
		const folder = await getFolder([...folderNames, data.category], "Item");
		if (folder) {
			await saveImage(data.image, data.name + ".png", imagePath);
			const payload: FUItem = {
				type: "consumable" as const,
				name: data.name,
				img: imagePath + "/" + data.name + ".png",
				folder: folder._id,
				system: {
					ipCost: { value: data.ipCost },
					description: data.description,
					source: { value: pageNum - 2 },
				},
			};
			await Item.create(payload);
		}
	}
};

const saveWeapons: SaveFunction<Weapon> = async (
	weapons: Weapon[],
	pageNum: number,
	folderNames: readonly string[],
	imagePath: string,
) => {
	const folder = await getFolder(folderNames, "Item");
	if (folder) {
		for (const data of weapons) {
			const saved = await saveImage(data.image, data.name + ".png", imagePath);
			if (saved && Object.keys(saved).length != 0) {
				const payload: FUItem = {
					type: "weapon" as const,
					name: data.name,
					img: imagePath + "/" + data.name + ".png",
					folder: folder._id,
					system: {
						isMartial: { value: data.martial },
						description: data.description === "No Quality." ? "" : data.description,
						cost: { value: data.cost },
						attributes: {
							primary: { value: STAT_MAPPING[data.accuracy.primary] },
							secondary: { value: STAT_MAPPING[data.accuracy.secondary] },
						},
						accuracy: { value: data.accuracy.bonus },
						damage: { value: data.damage },
						type: { value: data.melee },
						category: { value: data.category },
						hands: { value: data.hands },
						damageType: { value: data.damageType },
						source: { value: pageNum - 2 },
						isBehavior: false,
						weight: { value: 1 },
						isCustomWeapon: { value: false },
					},
				};
				await Item.create(payload);
			}
		}
	}
};

const saveArmors: SaveFunction<Armor> = async (
	armors: Armor[],
	pageNum: number,
	folderNames: readonly string[],
	imagePath: string,
) => {
	const folder = await getFolder(folderNames, "Item");
	if (folder) {
		for (const data of armors) {
			await saveImage(data.image, data.name + ".png", imagePath);
			const payload: FUItem = {
				type: "armor" as const,
				name: data.name,
				img: imagePath + "/" + data.name + ".png",
				folder: folder._id,
				system: {
					isMartial: { value: data.martial },
					description: data.description === "No Quality." ? "" : data.description,
					cost: { value: data.cost },
					source: { value: pageNum - 2 },
					def: { value: data.def },
					mdef: { value: data.mdef },
					init: { value: data.init },
					isBehavior: false,
					weight: { value: 1 },
				},
			};
			await Item.create(payload);
		}
	}
};

const saveAccessories: SaveFunction<Accessory> = async (
	accessories: Accessory[],
	pageNum: number,
	folderNames: readonly string[],
	imagePath: string,
) => {
	for (const data of accessories) {
		const folder = await getFolder(folderNames, "Item");
		if (folder) {
			await saveImage(data.image, data.name + ".png", imagePath);
			const payload: FUItem = {
				type: "accessory" as const,
				name: data.name,
				img: imagePath + "/" + data.name + ".png",
				folder: folder._id,
				system: {
					isMartial: { value: false },
					description: data.description,
					cost: { value: data.cost },
					source: { value: pageNum - 2 },
					def: { value: 0 },
					mdef: { value: 0 },
					init: { value: 0 },
					isBehavior: false,
					weight: { value: 1 },
				},
			};
			await Item.create(payload);
		}
	}
};

const saveShields: SaveFunction<Shield> = async (
	shields: Shield[],
	pageNum: number,
	folderNames: readonly string[],
	imagePath: string,
) => {
	const folder = await getFolder(folderNames, "Item");
	if (folder) {
		for (const data of shields) {
			await saveImage(data.image, data.name + ".png", imagePath);
			const payload: FUItem = {
				type: "shield" as const,
				name: data.name,
				img: imagePath + "/" + data.name + ".png",
				folder: folder._id,
				system: {
					isMartial: { value: data.martial },
					description: data.description === "No Quality." ? "" : data.description,
					cost: { value: data.cost },
					source: { value: pageNum - 2 },
					def: { value: data.def },
					mdef: { value: data.mdef },
					init: { value: data.init },
					isBehavior: false,
					weight: { value: 1 },
				},
			};
			await Item.create(payload);
		}
	}
};

const saveBeasts: SaveFunction<Beast> = async (
	beasts: Beast[],
	pageNum: number,
	folderNames: readonly string[],
	imagePath: string,
) => {
	for (const b of beasts) {
		const folder = await getFolder([...folderNames, b.type], "Actor");
		if (folder) {
			let mainHandFree = true;
			let offHandFree = true;

			const equipment = (b.equipment || [])
				.map((e) => {
					const item = game.items.find((f) => f.name.toLowerCase() === e.toLowerCase()) as FUItem;
					if (item) {
						const data = duplicate(item);
						const itemType = data.type;
						if (itemType === "weapon") {
							if (mainHandFree) {
								data.system.isEquipped = { slot: "mainHand", value: true };
								mainHandFree = false;
								if (data.system.hands.value == "two-handed") {
									offHandFree = false;
								}
							} else {
								if (offHandFree) {
									if (data.system.hands.value == "one-handed") {
										data.system.isEquipped = { slot: "offHand", value: true };
										offHandFree = false;
									}
								}
							}
						} else if (itemType === "shield") {
							if (offHandFree) {
								data.system.isEquipped = { slot: "offHand", value: true };
								offHandFree = false;
							}
						} else if (itemType == "accessory" || itemType == "armor") {
							data.system.isEquipped = { slot: itemType, value: true };
						}
						return data;
					} else {
						console.log("Not Found", e);
					}
				})
				.filter((d): d is FUItem => d !== undefined);
			const initBonus =
				b.attributes.init -
				equipment.reduce(
					(acc, i) =>
						(i.type == "armor" || i.type == "accessory" || i.type == "shield") && i.system.isEquipped
							? i.system.init.value
							: 0,
					0,
				) -
				(b.attributes.dex + b.attributes.ins) / 2;
			const calculatedMaxHp = 2 * b.level + 5 * b.attributes.mig;

			const calculatedMaxMp = b.level + 5 * b.attributes.wlp;
			const payload: FUActor = {
				system: {
					description: b.description,
					level: { value: b.level },
					resources: {
						hp: {
							value: b.attributes.maxHp,
							max: calculatedMaxHp,
							min: 0,
							bonus: b.attributes.maxHp - calculatedMaxHp,
						},
						mp: {
							value: b.attributes.maxMp,
							max: calculatedMaxMp,
							min: 0,
							bonus: b.attributes.maxMp - calculatedMaxMp,
						},
						ip: { value: 6, max: 6, min: 0 },
						fp: { value: 3 },
					},
					affinities: {
						physical: {
							base: AFF_MAPPING[b.resists.physical],
							current: AFF_MAPPING[b.resists.physical],
							bonus: 0 as const,
						},
						air: {
							base: AFF_MAPPING[b.resists.air],
							current: AFF_MAPPING[b.resists.air],
							bonus: 0 as const,
						},
						bolt: {
							base: AFF_MAPPING[b.resists.bolt],
							current: AFF_MAPPING[b.resists.bolt],
							bonus: 0 as const,
						},
						dark: {
							base: AFF_MAPPING[b.resists.dark],
							current: AFF_MAPPING[b.resists.dark],
							bonus: 0 as const,
						},
						earth: {
							base: AFF_MAPPING[b.resists.earth],
							current: AFF_MAPPING[b.resists.earth],
							bonus: 0 as const,
						},
						fire: {
							base: AFF_MAPPING[b.resists.fire],
							current: AFF_MAPPING[b.resists.fire],
							bonus: 0 as const,
						},
						ice: {
							base: AFF_MAPPING[b.resists.ice],
							current: AFF_MAPPING[b.resists.ice],
							bonus: 0 as const,
						},
						light: {
							base: AFF_MAPPING[b.resists.light],
							current: AFF_MAPPING[b.resists.light],
							bonus: 0 as const,
						},
						poison: {
							base: AFF_MAPPING[b.resists.poison],
							current: AFF_MAPPING[b.resists.poison],
							bonus: 0 as const,
						},
					},
					attributes: {
						dex: { base: b.attributes.dex, current: b.attributes.dex, bonus: 0 as const },
						ins: { base: b.attributes.ins, current: b.attributes.ins, bonus: 0 as const },
						mig: { base: b.attributes.mig, current: b.attributes.mig, bonus: 0 as const },
						wlp: { base: b.attributes.wlp, current: b.attributes.wlp, bonus: 0 as const },
					},
					derived: {
						init: { value: b.attributes.init, bonus: initBonus },
						def: { value: 0, bonus: b.equipment == null ? b.attributes.def : 0 },
						mdef: { value: 0, bonus: b.equipment == null ? b.attributes.mdef : 0 },
						accuracy: { value: 0, bonus: 0 },
						magic: { value: 0, bonus: 0 },
					},
					traits: { value: b.traits },
					species: { value: b.type.toLowerCase() },
					useEquipment: { value: b.equipment != null },
					source: { value: pageNum - 2 },
					villain: { value: "" as const },
					isElite: { value: false as const },
					isChampion: { value: 1 as const },
					isCompanion: { value: false as const },
					study: { value: 0 as const },
				},
				type: "npc",
				name: b.name,
				img: imagePath + "/" + b.name + ".png",
				prototypeToken: { texture: { src: imagePath + "/" + b.name + ".png" } },
				folder: folder._id,
			};
			await saveImage(b.image, b.name + ".png", imagePath);
			const actor = await Actor.create(payload);

			actor.createEmbeddedDocuments("Item", [
				...b.attacks.map((attack): FUItem => {
					return {
						type: "basic" as const,
						name: attack.name,
						system: {
							attributes: {
								primary: { value: STAT_MAPPING[attack.accuracy.primary] },
								secondary: { value: STAT_MAPPING[attack.accuracy.secondary] },
							},
							accuracy: { value: attack.accuracy.bonus },
							damage: { value: attack.damage },
							type: { value: attack.range },
							damageType: { value: attack.damageType },
							description: attack.description,
							isBehavior: false,
							weight: { value: 1 },
							quality: { value: "" as const },
						},
					};
				}),
				...b.spells.map((spell): FUItem => {
					return {
						type: "spell" as const,
						name: spell.name,
						system: {
							mpCost: { value: spell.mp },
							target: { value: spell.target },
							duration: { value: spell.duration },
							isOffensive: { value: spell.accuracy !== null },
							hasRoll: { value: spell.accuracy !== null },
							rollInfo:
								spell.accuracy == null
									? undefined
									: {
											attributes: {
												primary: { value: STAT_MAPPING[spell.accuracy.primary] },
												secondary: { value: STAT_MAPPING[spell.accuracy.secondary] },
											},
											accuracy: { value: spell.accuracy.bonus },
										},
							description: spell.description,
							isBehavior: false,
							weight: { value: 1 },
							quality: { value: spell.opportunity || ("" as const) },
						},
					};
				}),
				...b.otherActions.map((oa): FUItem => {
					return {
						name: oa.name,
						system: {
							description: oa.description,
							isBehavior: false,
							weight: { value: 1 },
							hasClock: { value: false },
							hasRoll: { value: false },
						},
						type: "miscAbility" as const,
					};
				}),
				...b.specialRules.map((sr): FUItem => {
					return {
						name: sr.name,
						system: {
							description: sr.description,
							isBehavior: false,
							weight: { value: 1 },
							hasClock: { value: false },
						},
						type: "rule" as const,
					};
				}),
			]);
			actor.createEmbeddedDocuments("Item", equipment);
		}
	}
};

const pageContentFolders: Record<PageContent, string[]> = {
	Accessory: ["Equipment", "Accessories"],
	"Basic Armor": ["Equipment", "Armors", "Basic"],
	"Basic Shield": ["Equipment", "Shield", "Basic"],
	"Basic Weapon": ["Equipment", "Weapon", "Basic"],
	Bestiary: ["Beastiary"],
	Consumable: ["Equipment", "Consumables"],
	"Rare Armor": ["Equipment", "Armors", "Rare"],
	"Rare Shield": ["Equipment", "Shield", "Rare"],
	"Rare Weapon": ["Equipment", "Weapon", "Rare"],
};

const pageContentSaveFunction: {
	[pageContent in PageContent]: SaveFunction<PageContentType[pageContent]>;
} = {
	Accessory: saveAccessories,
	"Basic Armor": saveArmors,
	"Basic Shield": saveShields,
	"Basic Weapon": saveWeapons,
	Bestiary: saveBeasts,
	Consumable: saveConsumables,
	"Rare Armor": saveArmors,
	"Rare Shield": saveShields,
	"Rare Weapon": saveWeapons,
};

type ParseResultWithoutCleanup =
	| {
			type: "success";
			page: number;
			results: { name: string }[];
			save: (imagePath: string) => Promise<void>;
	  }
	| {
			type: "failure";
			errors: { found: string; error: string; distance: number }[];
			page: number;
	  }
	| {
			type: "too many";
			count: number;
			errors: { found: string; error: string; distance: number }[];
			page: number;
	  };

type ParseResult = { page: number } & (
	| {
			type: "success";
			results: { name: string }[];
			save: (imagePath: string) => Promise<void>;
			cleanup: () => boolean;
	  }
	| { type: "failure"; errors: { found: string; error: string; distance: number }[] }
	| { type: "too many"; count: number; errors: { found: string; error: string; distance: number }[] }
);

const pr = (z: string | StringToken) => (typeof z === "string" ? z : `<Text str="${z.string}" font="${z.font}">`);

const parsePdf = async (pdfName: PDFName, pdfPath: string): Promise<[ParseResult[], () => Promise<void>]> => {
	const pageContent: Map<number, PageContent> = pdf[pdfName];
	const [withPage, destroy] = await tokenizePDF({
		url: pdfPath,
	});

	return [
		await Promise.all(
			[...pageContent.entries()].map(async ([pageNum, content]: [number, PageContent]): Promise<ParseResult> => {
				const folders: string[] = pageContentFolders[content];
				const parser: Parser<PageContentType[typeof content][]> = pageContentParser[content];
				const save = pageContentSaveFunction[content] as SaveFunction<PageContentType[typeof content]>;
				const [r, cleanup] = await withPage(
					pageNum,
					async (data: Token[]): Promise<ParseResultWithoutCleanup> => {
						const parses = parser([data, 0]);
						const successes = parses.filter(isResult);
						if (successes.length == 1) {
							return {
								type: "success",
								page: pageNum,
								results: successes[0].result[0].flat(1),
								save: async (imagePath: string) =>
									await save(successes[0].result[0], pageNum, folders, imagePath),
							};
						} else {
							const failures = parses.filter(isError);
							if (successes.length == 0) {
								return {
									type: "failure",
									page: pageNum,
									errors: failures.map((v) => {
										return { ...v, found: pr(v.found) };
									}),
								};
							} else {
								return {
									type: "too many",
									page: pageNum,
									count: successes.length,
									errors: failures.map((v) => {
										return { ...v, found: pr(v.found) };
									}),
								};
							}
						}
					},
				);
				if (r.type === "success") {
					return { ...r, cleanup };
				} else {
					cleanup();
					return r;
				}
			}),
		),
		destroy,
	];
};

type ImportPDFSubmissionData = {
	imagePath: string;
	pdfName: PDFName;
	pdfNames: Record<PDFName, PDFName>;
	pdfPath: string;
};

type ImportPDFData = ImportPDFSubmissionData & {
	parseResults: ParseResult[];
	destroy?: () => Promise<void>;
	inProgress: boolean;
};

export class ImportPDFApplication extends FormApplication<ImportPDFData> {
	async _updateObject<T extends ImportPDFSubmissionData>(_e: Event, data: T) {
		if (data.imagePath != this.object.imagePath) {
			this.object.imagePath = data.imagePath;
		}
		if (data.pdfName !== this.object.pdfName || data.pdfPath != this.object.pdfPath) {
			this.cleanupPDFResources();
			this.object.pdfName = data.pdfName;
			this.object.pdfPath = data.pdfPath;
			this.render();
			const [results, destroy] = await parsePdf(this.object.pdfName, this.object.pdfPath);
			this.object.parseResults = results;
			this.object.destroy = destroy;
		}
		this.render();
	}

	async getData(): Promise<ImportPDFData & { disabled: boolean }> {
		return {
			...this.object,
			disabled:
				this.object.imagePath === "" ||
				this.object.pdfPath === "" ||
				this.object.parseResults.length == 0 ||
				this.object.inProgress,
		};
	}
	get template(): string {
		return "modules/fu-parser/templates/import-pdf.hbs";
	}

	async close(options?: unknown) {
		this.cleanupPDFResources();
		return super.close(options);
	}

	private cleanupPDFResources() {
		for (const p of this.object.parseResults) {
			if (p.type === "success") {
				p.cleanup();
			}
		}
		if (this.object.destroy) {
			this.object.destroy();
		}
		this.object.parseResults = [];
		delete this.object.destroy;
	}

	activateListeners(html: JQuery): void {
		super.activateListeners(html);
		html.find(".fu-parser-collapsible").on("click", (e) => {
			e.preventDefault();
			const toggle = e.currentTarget;
			toggle.classList.toggle("fu-parser-active");
			const content = toggle.nextElementSibling as HTMLElement;
			if (content?.style.maxHeight) {
				content.style.maxHeight = "";
			} else {
				content.style.maxHeight = content.scrollHeight + "px";
			}
		});

		html.find("#sub").on("click", async (e) => {
			e.preventDefault();
			this.object.inProgress = true;
			this.render();
			const label = "Importing Fabula Ultima PDF";
			SceneNavigation.displayProgressBar({
				label,
				pct: 0,
			});
			for (let i = 0; i < this.object.parseResults.length; i++) {
				const p = this.object.parseResults[i];
				if (p.type === "success") {
					await p.save(this.object.imagePath);
					const percent: number = Math.round((i / this.object.parseResults.length) * 100);
					SceneNavigation.displayProgressBar({
						label,
						pct: percent,
					});
				}
			}
			SceneNavigation.displayProgressBar({
				label,
				pct: 100,
			});
			this.close();
		});
	}
}
