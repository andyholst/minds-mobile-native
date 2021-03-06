//@ts-nocheck
import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ThemedStyles from '../styles/ThemedStyles';
import i18n from '../common/services/i18n.service';
import Button from '../common/components/Button';
import reportService from './ReportService';
import TextInput from '../common/components/TextInput';
import MText from '../common/components/MText';

export default function ({ route }) {
  const CS = ThemedStyles.style;
  const appeal = route.params?.appeal ?? null;
  const navigation = useNavigation();
  if (!appeal) {
    return (
      <View style={[CS.flexContainer, CS.bgSecondaryBackground, CS.centered]}>
        <MText>{i18n.t('settings.reportedContent.noAppealData')}</MText>
      </View>
    );
  }

  const [note, setNote] = useState(appeal.note);
  const [loading, setLoading] = useState(false);

  const save = useCallback(async () => {
    setLoading(true);
    try {
      await reportService.sendAppealNote(appeal.report.urn, note);
      setLoading(false);
      navigation.goBack();
    } catch (err) {
      setLoading(false);
      Alert.alert(
        i18n.t('ops'),
        i18n.t('settings.reportedContent.noAppealData'),
      );
    }
  }, [setLoading, navigation]);

  return (
    <View style={[CS.flexContainer, CS.bgSecondaryBackground]}>
      <View style={styles.posterWrapper}>
        <TextInput
          style={[styles.poster, CS.colorPrimaryText]}
          editable={true}
          placeholder={i18n.t('settings.reportedContent.noteType')}
          placeholderTextColor={ThemedStyles.getColor('SecondaryText')}
          underlineColorAndroid="transparent"
          onChangeText={setNote}
          textAlignVertical="top"
          value={note}
          multiline={true}
          selectTextOnFocus={false}
          onSelectionChange={this.onSelectionChanges}
          testID="AppealNote"
        />
        <Button onPress={save} text={i18n.t('save')} />
      </View>
    </View>
  );
}

const styles = {
  posterWrapper: {
    minHeight: 100,
    flexDirection: 'row',
  },
  poster: {
    alignContent: 'flex-start',
    padding: 15,
    paddingTop: 15,
    flex: 1,
  },
};
