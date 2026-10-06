import { StatutIntervention } from '../common/enums/domain.enums';
import {
  computeInterventionStatus,
  normalizeInterventionStatus,
} from './intervention-status.util';

describe('computeInterventionStatus — règle métier du statut automatique', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('une intervention future est PLANIFIEE', () => {
    expect(
      computeInterventionStatus(new Date('2026-06-16T08:00:00.000Z'), now),
    ).toBe(StatutIntervention.PLANIFIEE);
  });

  it('une intervention passée est EN_COURS', () => {
    expect(
      computeInterventionStatus(new Date('2026-06-14T08:00:00.000Z'), now),
    ).toBe(StatutIntervention.EN_COURS);
  });

  it('une intervention à l’instant présent est EN_COURS', () => {
    expect(computeInterventionStatus(new Date(now), now)).toBe(
      StatutIntervention.EN_COURS,
    );
  });
});

describe('normalizeInterventionStatus', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('fait passer une PLANIFIEE dépassée en EN_COURS', () => {
    expect(
      normalizeInterventionStatus(
        StatutIntervention.PLANIFIEE,
        new Date('2026-06-10T08:00:00.000Z'),
        now,
      ),
    ).toBe(StatutIntervention.EN_COURS);
  });

  it('ne touche jamais à une intervention TERMINEE', () => {
    expect(
      normalizeInterventionStatus(
        StatutIntervention.TERMINEE,
        new Date('2026-06-10T08:00:00.000Z'),
        now,
      ),
    ).toBe(StatutIntervention.TERMINEE);
  });
});
