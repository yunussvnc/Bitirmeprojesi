import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectVenueIntent } from '../intentParser.ts';

test('Integration: Submitting "Naber" does not call recommendation API', async () => {
  let apiCalled = false;
  const mockRecommendPlaces = async () => {
    apiCalled = true;
    return { items: [], summary: "" };
  };

  const query = "Naber";
  const intent = detectVenueIntent(query);

  if (intent.hasIntent) {
    await mockRecommendPlaces();
  }

  assert.equal(apiCalled, false, 'Recommendation API should not be called for query with no intent');
});

test('Integration: Submitting "Kahve içmek istiyorum" calls recommendation API', async () => {
  let apiCalled = false;
  const mockRecommendPlaces = async () => {
    apiCalled = true;
    return { items: [], summary: "" };
  };

  const query = "Kahve içmek istiyorum";
  const intent = detectVenueIntent(query);

  if (intent.hasIntent) {
    await mockRecommendPlaces();
  }

  assert.equal(apiCalled, true, 'Recommendation API should be called for query with valid intent');
});

test('Snapshot: Warning card rendering condition logic when hasIntent === false', () => {
  const renderWarningCard = (hasIntent: boolean, validationWarning: string | null) => {
    if (!hasIntent && validationWarning) {
      return {
        type: 'WarningCard',
        props: {
          message: validationWarning,
          visible: true
        }
      };
    }
    return null;
  };

  const warningCard = renderWarningCard(false, "Lütfen bir mekan veya aktivite özelliği giriniz.");
  assert.deepEqual(warningCard, {
    type: 'WarningCard',
    props: {
      message: "Lütfen bir mekan veya aktivite özelliği giriniz.",
      visible: true
    }
  });

  const noWarningCard = renderWarningCard(true, null);
  assert.equal(noWarningCard, null);
});
