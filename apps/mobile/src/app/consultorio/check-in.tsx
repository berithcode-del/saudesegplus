import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { router } from 'expo-router';

const EXAM_FIELDS = [
  { id: 'pressao_sistolica', label: 'Pressão Sistólica (mmHg)', keyboard: 'numeric' as const },
  { id: 'pressao_diastolica', label: 'Pressão Diastólica (mmHg)', keyboard: 'numeric' as const },
  { id: 'peso', label: 'Peso (kg)', keyboard: 'decimal-pad' as const },
  { id: 'altura', label: 'Altura (cm)', keyboard: 'numeric' as const },
  { id: 'acuidade_od', label: 'Acuidade Visual OD', keyboard: 'default' as const },
  { id: 'acuidade_oe', label: 'Acuidade Visual OE', keyboard: 'default' as const },
  { id: 'audiometria', label: 'Audiometria', keyboard: 'default' as const },
];

const EXAM_TYPES = ['Admissional', 'Periódico', 'Retorno ao Trabalho', 'Mudança de Função', 'Demissional'];

export default function CheckInScreen() {
  const [step, setStep] = useState(0); // 0 = patient, 1 = exams, 2 = confirm
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [examType, setExamType] = useState('Admissional');
  const [exams, setExams] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    Alert.alert('✅ Sucesso!', `${name} foi adicionado à fila médica.`, [
      { text: 'OK', onPress: () => router.replace('/consultorio') },
    ]);
    setSending(false);
  };

  const STEPS = ['Paciente', 'Exames', 'Confirmar'];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, step >= i && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= i && styles.stepNumActive]}>
                {step > i ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, step >= i && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step 0: Patient */}
        {step === 0 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Dados do Paciente</Text>

            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do paciente"
              placeholderTextColor="#4a5568"
              value={name}
              onChangeText={setName}
              testID="input-patient-name"
            />

            <Text style={styles.label}>CPF *</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor="#4a5568"
              keyboardType="numeric"
              value={cpf}
              onChangeText={setCpf}
              testID="input-patient-cpf"
            />

            <Text style={styles.label}>Tipo de Exame</Text>
            {EXAM_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.optionBtn, examType === t && styles.optionBtnActive]}
                onPress={() => setExamType(t)}
              >
                <Text style={[styles.optionText, examType === t && styles.optionTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.nextBtn, (!name || !cpf) && styles.nextBtnDisabled]}
              onPress={() => setStep(1)}
              disabled={!name || !cpf}
              testID="btn-next-exams"
            >
              <Text style={styles.nextBtnText}>Próximo: Exames →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Exams */}
        {step === 1 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Resultados dos Exames</Text>
            {EXAM_FIELDS.map(field => (
              <View key={field.id}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType={field.keyboard}
                  placeholderTextColor="#4a5568"
                  placeholder="—"
                  value={exams[field.id] ?? ''}
                  onChangeText={v => setExams(prev => ({ ...prev, [field.id]: v }))}
                  testID={`input-exam-${field.id}`}
                />
              </View>
            ))}
            <View style={styles.row}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
                <Text style={styles.backBtnText}>← Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep(2)} testID="btn-next-confirm">
                <Text style={styles.nextBtnText}>Confirmar →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>✅ Confirmar Check-in</Text>

            <View style={styles.confirmCard}>
              <Text style={styles.confirmField}>Paciente</Text>
              <Text style={styles.confirmValue}>{name}</Text>
              <Text style={styles.confirmField}>CPF</Text>
              <Text style={styles.confirmValue}>{cpf}</Text>
              <Text style={styles.confirmField}>Tipo de Exame</Text>
              <Text style={styles.confirmValue}>{examType}</Text>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1 }, sending && styles.nextBtnDisabled]}
                onPress={handleSend}
                disabled={sending}
                testID="btn-send-queue"
              >
                <Text style={styles.nextBtnText}>
                  {sending ? '⏳ Enviando...' : '🚀 Enviar à Fila'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  steps: {
    flexDirection: 'row', justifyContent: 'center', gap: 24,
    paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  stepItem: { alignItems: 'center', gap: 6 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#3b6ff5', borderColor: '#3b6ff5' },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#4a5568' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: '#4a5568' },
  stepLabelActive: { color: '#3b6ff5' },
  scroll: { padding: 20, paddingBottom: 40 },
  form: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#e8eaf6', marginBottom: 8 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#4a5568',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#151d35',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, padding: 13, color: '#e8eaf6', fontSize: 15,
  },
  optionBtn: {
    padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  optionBtnActive: {
    backgroundColor: 'rgba(59,111,245,0.12)',
    borderColor: 'rgba(59,111,245,0.4)',
  },
  optionText: { fontSize: 14, color: '#8892b0' },
  optionTextActive: { color: '#3b6ff5', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  nextBtn: {
    backgroundColor: '#3b6ff5', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  backBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backBtnText: { color: '#8892b0', fontWeight: '600', fontSize: 15 },
  confirmCard: {
    backgroundColor: '#151d35', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: 'rgba(59,111,245,0.2)', gap: 6,
  },
  confirmField: { fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 0.5 },
  confirmValue: { fontSize: 16, fontWeight: '700', color: '#e8eaf6', marginBottom: 8 },
});
