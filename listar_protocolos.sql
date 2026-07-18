-- Lista todos os protocolos ASO existentes no banco
SELECT 
    p.id,
    p.numero_protocolo,
    p.status,
    p.tipo_exame,
    p.empresa_id,
    p.clinica_id,
    p.paciente_id,
    p.medico_id,
    p.exam_request_id,
    p.data_abertura,
    p.data_conclusao,
    c.name as paciente_nome,
    c.cpf as paciente_cpf
FROM "processos_aso" p
JOIN "Patient" c ON p.paciente_id = c.id
ORDER BY p.data_abertura DESC;