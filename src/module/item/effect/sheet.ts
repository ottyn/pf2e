import type { FormSelectOption } from "@client/applications/forms/fields.d.mts";
import type { EffectBadgeSource } from "@item/abstract-effect/index.ts";
import { ItemSheetDataPF2e, ItemSheetOptions, ItemSheetPF2e } from "@item/base/sheet/sheet.ts";
import { ErrorPF2e } from "@util";
import { htmlQuery, htmlQueryAll } from "@util/dom.ts";
import type { EffectSource } from "./data.ts";
import type { EffectPF2e } from "./document.ts";

export class EffectSheetPF2e extends ItemSheetPF2e<EffectPF2e> {
    static override get defaultOptions(): ItemSheetOptions {
        return { ...super.defaultOptions, hasSidebar: true };
    }

    protected override get validTraits(): Record<string, string> {
        return {};
    }

    override async getData(options?: Partial<ItemSheetOptions>): Promise<EffectSheetData> {
        const badge = this.item.badge;

        return {
            ...(await super.getData(options)),
            itemType: game.i18n.localize("PF2E.LevelLabel"),
            badgeType: badge ? game.i18n.localize(`PF2E.Item.Effect.Badge.Type.${badge.type}`) : "",
            expiryOptions: [
                { value: "turn-start", label: "PF2E.Item.Effect.Expiry.StartOfTurn" },
                { value: "turn-end", label: "PF2E.Item.Effect.Expiry.EndOfTurn" },
                { value: "round-end", label: "PF2E.Item.Effect.Expiry.EndOfRound" },
            ],
            reevaluateOptions: [
                { value: "initiative-roll", label: "PF2E.Item.Effect.Badge.ReevaluateFormula.InitiativeRoll" },
                { value: "turn-start", label: "PF2E.Item.Effect.Badge.ReevaluateFormula.TurnStart" },
                { value: "turn-end", label: "PF2E.Item.Effect.Badge.ReevaluateFormula.TurnEnd" },
            ],
            timeUnits: CONFIG.PF2E.timeUnits,
        };
    }

    override activateListeners($html: JQuery<HTMLElement>): void {
        super.activateListeners($html);
        const html = $html[0];

        // Prevent the form from submitting when the Badge Type select menu is changed
        htmlQuery(html, "select.badge-type")?.addEventListener("change", (event) => {
            event.stopPropagation();
        });

        htmlQuery(html, "[data-action=badge-add]")?.addEventListener("click", () => {
            const type = htmlQuery<HTMLSelectElement>(html, ".badge-type")?.value;
            const badge: Partial<EffectBadgeSource> =
                type === "formula" ? { type: "formula", value: "1d20", evaluate: true } : { type: "counter", value: 1 };
            this.item.update({ system: { badge } });
        });

        htmlQuery(html, "[data-action=badge-delete]")?.addEventListener("click", () => {
            this.item.update({ "system.badge": null });
        });

        htmlQuery(html, "[data-action=badge-add-label")?.addEventListener("click", () => {
            if (!this.item.system.badge) throw ErrorPF2e("Unexpected error adding badge label");
            const labels = this.item.system.badge.labels ?? [];
            labels.push("");
            this.item.update({ system: { badge: { labels } } });
        });

        for (const deleteIcon of htmlQueryAll(html, "[data-action=badge-delete-label]")) {
            const index = Number(deleteIcon.dataset.idx);
            deleteIcon.addEventListener("click", () => {
                const labels = this.item.system.badge?.labels;
                if (labels) {
                    labels.splice(index, 1);
                    if (labels.length === 0) {
                        this.item.update({ "system.badge.labels": null });
                    } else {
                        this.item.update({ system: { badge: { labels } } });
                    }
                }
            });
        }
    }

    protected override async _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        const expanded = fu.expandObject<DeepPartial<EffectSource>>(formData);
        const badge = expanded.system?.badge;
        // Ensure badge labels remain an array, needed due to _preUpdate clamping
        if (badge && "labels" in badge && typeof badge.labels === "object") {
            badge.labels = Object.values(badge.labels ?? []);
        }

        super._updateObject(event, fu.flattenObject(expanded));
    }
}

interface EffectSheetData extends ItemSheetDataPF2e<EffectPF2e> {
    badgeType: string;
    expiryOptions: FormSelectOption[];
    reevaluateOptions: FormSelectOption[];
    timeUnits: ConfigPF2e["PF2E"]["timeUnits"];
}
