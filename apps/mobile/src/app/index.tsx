import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';

const ROLES = [
  { id: 'OPERATOR', label: 'Consultório', icon: '🏥', desc: 'Check-in e exames' },
  { id: 'DOCTOR', label: 'Médico', icon: '👨‍⚕️', desc: 'Fila e teleconsulta' },
  { id: 'ADMIN', label: 'Admin', icon: '⚙️', desc: 'Gestão de cadastros' },
];

export default function LoginScreen() {
  const [role, setRole] = useState('OPERATOR');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor informe o e-mail.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://10.0.2.2:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Acesso negado', 'E-mail ou perfil incorreto.');
        return;
      }
      if (role === 'OPERATOR') router.replace('/consultorio');
      else if (role === 'DOCTOR') router.replace('/medico');
      else Alert.alert('Admin', 'Módulo admin em desenvolvimento.');
    } catch {
      // MVP: allow mock login offline
      if (role === 'OPERATOR') router.replace('/consultorio');
      else if (role === 'DOCTOR') router.replace('/medico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>SaúdeSeg+</Text>
          <Text style={styles.subtitle}>Telemedicina Ocupacional</Text>
        </View>

        {/* Role Selector */}
        <Text style={styles.sectionLabel}>Seu Perfil</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.roleCard, role === r.id && styles.roleCardActive]}
              onPress={() => setRole(r.id)}
              accessibilityLabel={`Perfil ${r.label}`}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleName, role === r.id && styles.roleNameActive]}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Email */}
        <Text style={styles.sectionLabel}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#4a5568"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          testID="input-email"
        />

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          testID="btn-login"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>→ Entrar</Text>
          }
        </TouchableOpacity>

        {/* Dev hint */}
        <View style={styles.hint}>
          <Text style={styles.hintTitle}>Contas para teste</Text>
          <Text style={styles.hintText}>🏥 operator@saudeseg.com</Text>
          <Text style={styles.hintText}>👨‍⚕️ medico.sp@saudeseg.com</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e1a' },
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    fontSize: 34, fontWeight: '800', color: '#3b6ff5',
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: '#8892b0', marginTop: 4 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#4a5568',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleCard: {
    flex: 1, alignItems: 'center', padding: 14,
    backgroundColor: '#151d35',
    borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.07)',
  },
  roleCardActive: { borderColor: '#3b6ff5', backgroundColor: 'rgba(59,111,245,0.1)' },
  roleIcon: { fontSize: 24, marginBottom: 4 },
  roleName: { fontSize: 12, fontWeight: '700', color: '#8892b0' },
  roleNameActive: { color: '#3b6ff5' },
  roleDesc: { fontSize: 10, color: '#4a5568', marginTop: 2, textAlign: 'center' },
  input: {
    backgroundColor: '#151d35',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, padding: 14, color: '#e8eaf6',
    fontSize: 15, marginBottom: 20,
  },
  btn: {
    backgroundColor: '#3b6ff5', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: {
    marginTop: 32, padding: 16,
    backgroundColor: 'rgba(59,111,245,0.06)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,111,245,0.15)',
  },
  hintTitle: { fontSize: 12, fontWeight: '700', color: '#3b6ff5', marginBottom: 6 },
  hintText: { fontSize: 12, color: '#8892b0', marginBottom: 2 },
});
