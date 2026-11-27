import { describe, expect, it } from "vitest";
import {
  addBusinessDaysToKey,
  addMonthsToKey,
  countBusinessDaysBetweenKeys,
  easterSunday,
  frenchHolidays,
  isBusinessDayKey,
  monthsBetween,
  parisDayKey,
  parisEndOfToday,
  parisMidnight,
  parisMonthStartKey,
} from "@/lib/dates";
import { addBusinessDays, countBusinessDays } from "@/lib/business-days";
import { dueBadgeFromDate } from "@/lib/dueStatus";
import { scheduleProspects } from "@/lib/prospectScheduling";
import { formatDateFr } from "@/lib/format";

describe("jour du calendrier à Paris", () => {
  it("lit pareil les deux formats déjà enregistrés en base", () => {
    expect(parisDayKey(new Date("2026-11-26T23:00:00Z"))).toBe("2026-11-27"); // minuit Paris (hiver)
    expect(parisDayKey(new Date("2026-11-27T00:00:00Z"))).toBe("2026-11-27"); // minuit UTC
    expect(parisDayKey(new Date("2026-07-13T22:00:00Z"))).toBe("2026-07-14"); // minuit Paris (été)
    expect(parisDayKey(new Date("2026-07-14T00:00:00Z"))).toBe("2026-07-14");
  });

  it("bascule à minuit Paris, pas à minuit UTC", () => {
    expect(parisDayKey(new Date("2026-11-27T22:59:00Z"))).toBe("2026-11-27");
    expect(parisDayKey(new Date("2026-11-27T23:01:00Z"))).toBe("2026-11-28");
  });

  it("minuit à Paris, hiver comme été et les jours de changement d'heure", () => {
    expect(parisMidnight("2026-11-27").toISOString()).toBe("2026-11-26T23:00:00.000Z");
    expect(parisMidnight("2026-07-14").toISOString()).toBe("2026-07-13T22:00:00.000Z");
    expect(parisMidnight("2026-03-29").toISOString()).toBe("2026-03-28T23:00:00.000Z"); // passage à l'heure d'été
    expect(parisMidnight("2026-10-25").toISOString()).toBe("2026-10-24T22:00:00.000Z"); // retour à l'heure d'hiver
  });

  it("fin de journée et début de mois à Paris", () => {
    const at = new Date("2026-11-30T23:30:00Z"); // déjà le 1er décembre à Paris
    expect(parisEndOfToday(at).toISOString()).toBe("2026-12-01T22:59:59.999Z");
    expect(parisMonthStartKey(at)).toBe("2026-12-01");
  });

  it("affiche la date de Paris", () => {
    expect(formatDateFr("2026-11-26T23:00:00Z")).toBe("27/11/2026");
  });

  it("ajoute des mois et compte les mois", () => {
    expect(addMonthsToKey("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsToKey("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsToKey("2026-11-27", 3)).toBe("2027-02-27");
    expect(monthsBetween(new Date("2026-01-15T10:00:00Z"), new Date("2026-03-01T10:00:00Z"))).toBe(2);
    expect(monthsBetween(new Date("2026-11-30T23:30:00Z"), new Date("2026-12-02T10:00:00Z"))).toBe(0);
  });
});

describe("jours fériés français", () => {
  it("calcule Pâques pour toute année", () => {
    expect(easterSunday(2024)).toBe("2024-03-31");
    expect(easterSunday(2025)).toBe("2025-04-20");
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
    expect(easterSunday(2030)).toBe("2030-04-21");
  });

  it("donne les 11 fériés, fêtes mobiles comprises", () => {
    const h2027 = frenchHolidays(2027);
    expect(h2027.size).toBe(11);
    expect(h2027.get("2027-03-29")).toBe("Lundi de Pâques");
    expect(h2027.get("2027-05-06")).toBe("Ascension");
    expect(h2027.get("2027-05-17")).toBe("Lundi de Pentecôte");
    // Mêmes dates que l'ancienne liste 2026 écrite à la main
    const h2026 = [...frenchHolidays(2026).keys()].sort();
    expect(h2026).toEqual([
      "2026-01-01", "2026-04-06", "2026-05-01", "2026-05-08", "2026-05-14", "2026-05-25",
      "2026-07-14", "2026-08-15", "2026-11-01", "2026-11-11", "2026-12-25",
    ]);
  });

  it("un jour férié en semaine n'est pas ouvré", () => {
    expect(isBusinessDayKey("2026-11-11")).toBe(false); // mercredi férié
    expect(isBusinessDayKey("2026-11-12")).toBe(true);
    expect(isBusinessDayKey("2026-11-28")).toBe(false); // samedi
  });
});

describe("jours ouvrés (relances)", () => {
  it("saute week-ends et fériés en ajoutant des jours", () => {
    expect(addBusinessDaysToKey("2026-11-10", 1)).toBe("2026-11-12"); // le 11/11 est sauté
    expect(addBusinessDaysToKey("2026-12-24", 1)).toBe("2026-12-28"); // Noël + week-end
    expect(addBusinessDaysToKey("2027-03-26", 1)).toBe("2027-03-30"); // week-end + lundi de Pâques
  });

  it("compte les jours ouvrés écoulés", () => {
    expect(countBusinessDaysBetweenKeys("2026-11-09", "2026-11-13")).toBe(3); // 10, 12, 13 (11 férié)
    expect(countBusinessDaysBetweenKeys("2026-11-13", "2026-11-13")).toBe(0);
    expect(countBusinessDaysBetweenKeys("2026-11-13", "2026-11-12")).toBe(0);
  });

  it("relance enregistrée à minuit Paris du bon jour", () => {
    const d = addBusinessDays(new Date("2026-11-10T09:00:00Z"), 1);
    expect(d.toISOString()).toBe("2026-11-11T23:00:00.000Z");
    expect(parisDayKey(d)).toBe("2026-11-12");
    // 2026-11-09T23:00Z = le 10/11 à Paris → jours ouvrés écoulés : 12 et 13 (le 11 est férié)
    expect(countBusinessDays(new Date("2026-11-09T23:00:00Z"), new Date("2026-11-13T15:00:00Z"))).toBe(2);
  });
});

describe("badge Aujourd'hui / En retard", () => {
  const now = new Date("2026-11-27T08:00:00Z"); // vendredi 27/11, 9h à Paris

  it("un rappel choisi au calendrier pour aujourd'hui = « Aujourd'hui » (bug corrigé)", () => {
    expect(dueBadgeFromDate(new Date("2026-11-26T23:00:00Z"), now)).toEqual({ variant: "today", lateDays: 0 });
    expect(dueBadgeFromDate(new Date("2026-11-27T00:00:00Z"), now)).toEqual({ variant: "today", lateDays: 0 });
  });

  it("demain n'est pas dû ; hier est en retard", () => {
    expect(dueBadgeFromDate(new Date("2026-11-27T23:00:00Z"), now)).toBeNull();
    expect(dueBadgeFromDate(new Date("2026-11-25T23:00:00Z"), now)).toEqual({ variant: "late", lateDays: 1 });
  });

  it("le soir à Paris, le jour n'a pas encore changé", () => {
    const evening = new Date("2026-11-27T22:30:00Z"); // 23h30 à Paris
    expect(dueBadgeFromDate(new Date("2026-11-26T23:00:00Z"), evening)?.variant).toBe("today");
  });
});

describe("programmation des prospects", () => {
  it("évite les fériés de toutes les années et espace de 2 jours ouvrés", () => {
    const plan = scheduleProspects(
      [
        { id: "a", brandCategory: "GRANDE_MARQUE" },
        { id: "b", brandCategory: "PME_STARTUP" },
        { id: "c", brandCategory: "INDEPENDANT" },
      ],
      { lastScheduledDate: new Date("2026-12-23T23:00:00Z"), spacingDays: 2, minStartDate: new Date("2026-08-10") }
    );
    const days = ["a", "b", "c"].map((id) => parisDayKey(plan.get(id)!));
    // après le 24/12 : 25 (Noël), 26-27 (week-end), 1er janvier 2027 (férié) sont sautés
    expect(days).toEqual(["2026-12-29", "2026-12-31", "2027-01-05"]);
  });
});
