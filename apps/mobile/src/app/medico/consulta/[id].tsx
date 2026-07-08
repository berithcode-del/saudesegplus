import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

const EXAMS = [
  { key: 'pressao_sistolica', label: 'Pressão Sistólica', value: '120 mmHg', ok: true },
  { key: 'pressao_diastolica', label: 'Pressão Diastólica', value: '80 mmHg', ok: true },
  { key: 'peso', label: 'Peso', value: '75.5 kg', ok: true },
  { key: 'altura', label: 'Altura', value: '170 cm', ok: true },
  { key: 'acuidade_od', label: 'Acuidade Visual OD', value: '20/20', ok: true },
  { key: 'acuidade_oe', label: 'Acuidade Visual OE', value: '20/30', ok: false },
  { key: 'audiometria', label: 'Audiometria', value: 'Normal', ok: true },
];

type Decision = 'APTO' | 'APTO_COM_RESTRICAO' | 'INAPTO' | null;

const DECISIONS = [
  { value: 'APTO' as Decision, label: '✅ Apto', color: '#38a169', bg: 'rgba(56,161,105,0.15)' },
  { value: 'APTO_COM_RESTRICAO' as Decision, label: '⚠️ Apto com Restrição', color: '#f5a623', bg: 'rgba(245,166,35,0.15)' },
  { value: 'INAPTO' as Decision, label: '❌ Inapto', color: '#e53e3e', bg: 'rgba(229,62,62,0.15)' },
];

export default function ConsultaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<'exames' | 'notas'>('exames');
  const [decision, setDecision] = useState<Decision>(null);
  const [notes, setNotes] = useState('');
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!decision) {
      Alert.alert('Atenção', 'Selecione uma decisão antes de assinar.');
      return;
    }
    setSigning(true);
    await new Promise(r => setTimeout(r, 1200));
    Alert.alert('ASO Emitido!', `Decisão: ${decision}\nASO gerado com sucesso.`, [
      { text: 'OK', onPress: () => router.replace('/medico') },
    ]);
    setSigning(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Patient card */}
      <View style={styles.patientCard}>
        <View>
          <Text style={styles.patientName}>Carlos Mendes</Text>
          <Text style={styles.patientSub}>Admissional · CBO 7171-10</Text>
          <Text style={styles.patientLoc}>📍 São Paulo/SP · Clínica Central SP</Text>
        </View>
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>📍 Mesma Cidade</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['exames', 'notas'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'exames' ? '🧪 Exames' : '📝 Notas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'exames' && (
          <View style={styles.section}>
            {EXAMS.map(exam => (
              <View key={exam.key} style={[styles.examRow, !exam.ok && styles.examRowWarn]}>
                <Text style={styles.examLabel}>{exam.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.examValue, !exam.ok && styles.examValueWarn]}>
                    {exam.value}
                  </Text>
                  {!exam.ok && <Text>⚠️</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'notas' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Anotações Clínicas</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Digite suas observações clínicas aqui..."
              placeholderTextColor="#4a5568"
              value={notes}
              onChangeText={setNotes}
              testID="clinical-notes"
            />
          </View>
        )}

        {/* Decision */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Decisão do ASO</Text>
          {DECISIONS.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[
                styles.decisionBtn,
                decision === d.value && { backgroundColor: d.bg, borderColor: d.color },
              ]}
              onPress={() => setDecision(d.value)}
              testID={`btn-decision-${d.value?.toLowerCase()}`}
            >
              <Text style={[styles.decisionText, decision === d.value && { color: d.color }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign button */}
        <TouchableOpacity
          style={[styles.signBtn, (!decision || signing) && styles.signBtnDisabled]}
          onPress={handleSign}
          disabled={!decision || signing}
          testID="btn-sign-aso"
        >
          <Text style={styles.signBtnText}>
            {signing ? '⏳ Processando assinatura...' : '✍️ Assinar e Emitir ASO'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  patientCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    margin: 16, padding: 16,
    backgroundColor: '#151d35', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  patientName: { fontSize: 18, fontWeight: '800', color: '#e8eaf6' },
  patientSub: { fontSize: 13, color: '#8892b0', marginTop: 2 },
  patientLoc: { fontSize: 12, color: '#4a5568', marginTop: 2 },
  priorityBadge: {
    backgroundColor: 'rgba(0,212,170,0.12)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  priorityText: { fontSize: 11, fontWeight: '700', color: '#00d4aa' },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#151d35', borderRadius: 10, padding: 4,
    marginBottom: 4,
  },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(59,111,245,0.2)' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#4a5568' },
  tabTextActive: { color: '#3b6ff5' },
  scroll: { padding: 16, paddingTop: 8, gap: 16, paddingBottom: 40 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#4a5568',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  examRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  examRowWarn: {
    backgroundColor: 'rgba(245,166,35,0.06)',
    borderColor: 'rgba(245,166,35,0.2)',
  },
  examLabel: { fontSize: 13, color: '#8892b0' },
  examValue: { fontSize: 13, fontWeight: '700', color: '#e8eaf6' },
  examValueWarn: { color: '#f5a623' },
  notesInput: {
    backgroundColor: '#151d35', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    color: '#e8eaf6', fontSize: 14,
    padding: 14, minHeight: 140, textAlignVertical: 'top',
  },
  decisionBtn: {
    padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  decisionText: { fontSize: 15, fontWeight: '700', color: '#8892b0' },
  signBtn: {
    backgroundColor: '#3b6ff5', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  signBtnDisabled: { opacity: 0.4 },
  signBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
