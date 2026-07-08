import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';

const PRIORITY_MAP = [
  { score: 0, label: 'Mesma Cidade', color: '#00d4aa', bg: 'rgba(0,212,170,0.12)' },
  { score: 1, label: 'Mesma Região', color: '#3b6ff5', bg: 'rgba(59,111,245,0.12)' },
  { score: 2, label: 'Mesmo Estado', color: '#f5a623', bg: 'rgba(245,166,35,0.12)' },
  { score: 3, label: 'Nacional', color: '#8892b0', bg: 'rgba(74,85,104,0.2)' },
];

const MOCK_QUEUE = [
  {
    id: 'q1', city: 'São Paulo', state: 'SP', priorityScore: 0,
    enteredQueueAt: new Date(Date.now() - 12 * 60000).toISOString(),
    patientName: 'Carlos Mendes', examPurpose: 'Admissional',
    clinicName: 'Clínica Central SP',
  },
  {
    id: 'q3', city: 'Curitiba', state: 'PR', priorityScore: 1,
    enteredQueueAt: new Date(Date.now() - 8 * 60000).toISOString(),
    patientName: 'Roberto Lima', examPurpose: 'Retorno',
    clinicName: 'OcuSaúde Curitiba',
  },
  {
    id: 'q2', city: 'Campinas', state: 'SP', priorityScore: 2,
    enteredQueueAt: new Date(Date.now() - 28 * 60000).toISOString(),
    patientName: 'Fernanda Costa', examPurpose: 'Periódico',
    clinicName: 'Clínica Campinas Norte',
  },
  {
    id: 'q4', city: 'João Pessoa', state: 'PB', priorityScore: 3,
    enteredQueueAt: new Date(Date.now() - 45 * 60000).toISOString(),
    patientName: 'Ana Souza', examPurpose: 'Admissional',
    clinicName: 'MedWork PB',
  },
];

export default function MedicoFilaScreen() {
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [refreshing, setRefreshing] = useState(false);

  const getWaitTime = (since: string) => {
    const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
    return mins < 60 ? `${mins}min` : `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  };

  const handleAccept = (id: string) => {
    router.push(`/medico/consulta/${id}`);
  };

  const renderItem = ({ item, index }: { item: typeof MOCK_QUEUE[0]; index: number }) => {
    const priority = PRIORITY_MAP[item.priorityScore];
    const waitTime = getWaitTime(item.enteredQueueAt);
    const isUrgent = parseInt(waitTime) > 30;

    return (
      <View style={[styles.card, index === 0 && styles.cardFirst]}>
        <View style={styles.cardHeader}>
          <View style={styles.position}>
            <Text style={[styles.positionText, index === 0 && styles.positionFirst]}>
              #{index + 1}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>
          <Text style={[styles.waitTime, isUrgent && styles.waitUrgent]}>
            ⏱ {waitTime}
          </Text>
        </View>

        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.details}>{item.examPurpose} · {item.clinicName}</Text>
        <Text style={styles.location}>📍 {item.city}/{item.state}</Text>

        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAccept(item.id)}
          testID={`btn-accept-${item.id}`}
        >
          <Text style={styles.acceptBtnText}>✓ Aceitar Paciente</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Fila Global</Text>
          <Text style={styles.headerSub}>{queue.length} pacientes aguardando</Text>
        </View>
        <View style={styles.onlineChip}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      <FlatList
        data={queue}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b6ff5"
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum paciente na fila no momento.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#e8eaf6' },
  headerSub: { fontSize: 13, color: '#8892b0', marginTop: 2 },
  onlineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(56,161,105,0.12)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#38a169' },
  onlineText: { fontSize: 12, fontWeight: '700', color: '#38a169' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#151d35',
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  cardFirst: {
    borderColor: 'rgba(59,111,245,0.3)',
    backgroundColor: 'rgba(59,111,245,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  position: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  positionText: { fontSize: 12, fontWeight: '700', color: '#8892b0' },
  positionFirst: { color: '#3b6ff5' },
  priorityBadge: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, alignItems: 'center',
  },
  priorityText: { fontSize: 11, fontWeight: '700' },
  waitTime: { fontSize: 13, fontWeight: '600', color: '#8892b0' },
  waitUrgent: { color: '#e53e3e' },
  patientName: { fontSize: 17, fontWeight: '700', color: '#e8eaf6', marginBottom: 4 },
  details: { fontSize: 13, color: '#8892b0', marginBottom: 2 },
  location: { fontSize: 12, color: '#4a5568', marginBottom: 14 },
  acceptBtn: {
    backgroundColor: 'rgba(56,161,105,0.15)',
    borderWidth: 1, borderColor: 'rgba(56,161,105,0.3)',
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  acceptBtnText: { color: '#38a169', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: '#4a5568', marginTop: 60, fontSize: 15 },
});
