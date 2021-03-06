import React, { useCallback, useEffect, useState } from 'react';
import MText from '~/common/components/MText';
import { storages } from '~/common/services/storage/storages.service';
import { Column, IconButtonNext } from '~/common/ui';
import ThemedStyles from '~/styles/ThemedStyles';
import { BottomSheetModal } from '../../components/bottom-sheet';
import Button from '../../components/Button';
import i18n from '../../services/i18n.service';
import Questions from './Questions';
import { useQuestions } from './useQuestions';

type PropsType = {};

/**
 * the duration that the prompt should be dismissed in ms
 */
const PROMPT_DISMISS_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

const SOCIAL_COMPASS_QUESTIONNAIRE_DISMISSED_KEY =
  'social-compass-questionnaire:dismissed';

const SocialCompassPrompt = ({}: PropsType) => {
  const ref = React.useRef<any>();
  const { result: questionsResult, loading } = useQuestions();
  const [dismissed, dismiss] = useDismissHandler(questionsResult);

  // #region methods
  const showSheet = useCallback(() => {
    ref.current?.present();
  }, []);
  // #endregion

  if (dismissed !== false) {
    return null;
  }

  return (
    <Column vertical="L" horizontal="L">
      <Column vertical="XL">
        <MText style={styles.title}>
          {i18n.t('socialCompass.promptTitle')}
        </MText>
        <MText style={styles.desc}>{i18n.t('socialCompass.promptDesc')}</MText>
        <Button
          text={i18n.t('socialCompass.callToAction')}
          action
          onPress={showSheet}
          testID="customizeBtn"
        />
      </Column>
      <IconButtonNext
        name="close"
        onPress={dismiss}
        style={ThemedStyles.style.positionAbsoluteTopRight}
      />
      <BottomSheetModal ref={ref} title={i18n.t('socialCompass.promptTitle')}>
        <Questions
          questions={questionsResult?.questions}
          loading={loading}
          onSubmit={dismiss}
        />
      </BottomSheetModal>
    </Column>
  );
};

const styles = ThemedStyles.create({
  title: [
    'colorPrimaryText',
    'fontLM',
    'fontMedium',
    'marginBottom',
    'textCenter',
  ],
  desc: [
    'colorSecondaryText',
    { fontSize: 15 },
    'marginBottom4x',
    'textCenter',
  ],
});

export default SocialCompassPrompt;

function useDismissHandler(questionsResult): [boolean | undefined, () => void] {
  const answersProvideed = questionsResult?.answersProvided;
  const [dismissed, setDismissed] = useState<boolean | undefined>(undefined);

  const dismiss = useCallback(async () => {
    storages.user?.setString(
      SOCIAL_COMPASS_QUESTIONNAIRE_DISMISSED_KEY,
      String(Date.now()),
    );
    setDismissed(true);
  }, [setDismissed]);

  // determine whether we've already answered the questions or not
  useEffect(() => {
    if (!questionsResult) {
      return;
    }

    // if we had already answered
    if (answersProvideed) {
      setDismissed(true);
    } else {
      const dismissedTs = storages.user?.getString(
        SOCIAL_COMPASS_QUESTIONNAIRE_DISMISSED_KEY,
      );

      if (!dismissedTs) {
        return setDismissed(false);
      }

      // if 3 days had passed since we last dismissed prompt, remove dismiss key and show the prompt again!
      if (Date.now() - Number(dismissedTs) > PROMPT_DISMISS_DURATION) {
        storages.user?.removeItem(SOCIAL_COMPASS_QUESTIONNAIRE_DISMISSED_KEY);
        setDismissed(false);
      } else {
        setDismissed(true);
      }
    }
  }, [answersProvideed, questionsResult, setDismissed]);

  return [dismissed, dismiss];
}
