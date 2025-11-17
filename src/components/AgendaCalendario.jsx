import { useState, useEffect } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import '../App.css'; 

/**
 * Componente do Calendário Visual.
 * Agora ele é responsável por filtrar os eventos que não devem ser mostrados.
 */
function AgendaCalendario({ onDateClick, key }) {
    const [eventos, setEventos] = useState([]);
    const [config, setConfig] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function carregarDados() {
            try {
                // 1. Busca os dados (Backend agora envia TODOS, incluindo Cancelados)
                const [respostaEventos, respostaConfig] = await Promise.all([
                    axios.get("http://localhost:8080/agendamentos"),
                    axios.get("http://localhost:8080/configuracao")
                ]);

                // 2. Filtra aqui, no Frontend
                const eventosVisiveis = respostaEventos.data
                    .filter(ag => ag.status !== 'Cancelado');

                // 3. Formata os eventos que sobraram para o FullCalendar
                const eventosFormatados = eventosVisiveis.map(ag => ({
                    id: ag.idAgendamento,
                    title: ag.servicos.join(', '), // O título (Ex: "Corte, Barba")
                    start: ag.dataHora,
                    end: ag.dataHoraFim,
                    backgroundColor: 
                        ag.status === 'Concluído' ? '#2a9d8f' : '#0069ff',
                    borderColor: 
                        ag.status === 'Concluído' ? '#2a9d8f' : '#0069ff'
                }));
                
                setEventos(eventosFormatados);
                setConfig(respostaConfig.data);

            } catch (error) {
                console.error("Erro ao carregar dados do calendário:", error);
            } finally {
                setCarregando(false);
            }
        }
        carregarDados();
    }, [key]); 

    if (carregando || !config) {
        return <p>Carregando calendário...</p>;
    }

    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={eventos} // Passa a lista já filtrada
            editable={false}
            selectable={true}
            allDaySlot={false}
            slotMinTime={config.inicioExpediente}
            slotMaxTime={config.fimExpediente}

            // As propriedades 'slotEventOverlap' e 'eventDisplay' foram removidas.
            // Vamos deixar o FullCalendar usar seu comportamento padrão de empilhamento.

            dateClick={(info) => {
                const dataFormatada = info.dateStr.substring(0, 16);
                if (onDateClick) {
                    onDateClick(dataFormatada); 
                }
            }}

            height="auto"
            locale="pt-br"
            buttonText={{
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia'
            }}
        />
    );
}

export default AgendaCalendario;