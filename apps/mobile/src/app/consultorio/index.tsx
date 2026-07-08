import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';

const MOCK_QUEUE = [
  {
    id: '1', patientName: 'Carlos Mendes',
    examType: 'Admissional', status: 'WAITING',
    waitingSince: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: '2', patientName: 'Ana Ferreira',
    examType: 'Periódico', status: 'IN_PROGRESS',
    waitingSince: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: '3', patientName: 'Roberto Silva',
    examType: 'Admissional', status: 'WAITING',
    waitingSince: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  WAITING: { label: '⏳ Aguardando', color: '#f5a623', bg: 'rgba(245,166,35,0.12)' },
  IN_PROGRESS: { label: '🔵 Em Atendimento', color: '#3b6ff5', bg: 'rgba(59,111,245,0.12)' },
  COMPLETED: { label: '✅ Concluído', color: '#38a169', bg: 'rgba(56,161,105,0.12)' },
};

export default function ConsultorioScreen() {
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

  const waiting = queue.filter(q => q.status === 'WAITING').length;
  const inProgress = queue.filter(q => q.status === 'IN_PROGRESS').length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Painel da Clínica</Text>
          <Text style={styles.headerSub}>Clínica Central SP</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/consultorio/check-in')}
          testID="btn-new-checkin"
        >
          <Text style={styles.addBtnText}>＋ Check-in</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: '#f5a623' }]}>
          <Text style={[styles.statValue, { color: '#f5a623' }]}>{waiting}</Text>
          <Text style={styles.statLabel}>Na Fila</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#3b6ff5' }]}>
          <Text style={[styles.statValue, { color: '#3b6ff5' }]}>{inProgress}</Text>
          <Text style={styles.statLabel}>Em Atendimento</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#38a169' }]}>
          <Text style={[styles.statValue, { color: '#38a169' }]}>5</Text>
          <Text style={styles.statLabel}>Concluídos</Text>
        </View>
      </View>

      <FlatList
        data={queue}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b6ff5"
          />
        }
        ListHeaderComponent={<Text style={styles.listTitle}>Fila de Pacientes</Text>}
        renderItem={({ item }) => {
          const status = STATUS_MAP[item.status];
          const waitTime = getWaitTime(item.waitingSince);
          return (
            <View style={styles.queueCard}>
              <View style={styles.queueCardTop}>
                <Text style={styles.queueName}>{item.patientName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>
              <View style={styles.queueCardBottom}>
                <Text style={styles.queueDetail}>{item.examType}</Text>
                <Text style={styles.queueWait}>⏱ {waitTime}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#e8eaf6' },
  headerSub: { fontSize: 12, color: '#8892b0', marginTop: 2 },
  addBtn: {
    backgroundColor: '#3b6ff5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#151d35',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderTopWidth: 2, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#8892b0', marginTop: 2, textAlign: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  listTitle: {
    fontSize: 14, fontWeight: '700', color: '#4a5568',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  queueCard: {
    backgroundColor: '#151d35', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  queueCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  queueName: { fontSize: 16, fontWeight: '700', color: '#e8eaf6', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  queueCardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  queueDetail: { fontSize: 13, color: '#8892b0' },
  queueWait: { fontSize: 13, color: '#8892b0' },
});
