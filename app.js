// Lógica Interactiva para la Web del Día de Canarias - El Gofio

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de estados
  // currentHour = null significa que NO hay hora seleccionada (la tabla está oculta)
  let currentHour = null;
  let selectedCourse = null;
  let starredActivities = JSON.parse(localStorage.getItem('starred_activities')) || [];

  // Elementos del DOM
  const generalNotesText = document.getElementById('general-notes-text');
  const hourTabsContainer = document.getElementById('hour-tabs-container');
  const courseSelectorGrid = document.getElementById('course-selector-grid');

  const scheduleTableBody = document.getElementById('schedule-table-body');
  const mobileCardsContainer = document.getElementById('mobile-cards-container');
  const hourContentPanel = document.getElementById('hour-content-panel');
  const emptyHourState = document.getElementById('empty-hour-state');

  const timelineDisplay = document.getElementById('timeline-display');
  const emptyTimelineState = document.getElementById('empty-timeline-state');
  const timelineItemsContainer = document.getElementById('timeline-items-container');
  const printTimelineBtn = document.getElementById('print-timeline-btn');
  const selectedCourseTitle = document.getElementById('selected-course-title');

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const activeHourTitle = document.getElementById('active-hour-title');
  const activeHourBadge = document.getElementById('active-hour-badge');

  // Ocultar el panel de la tabla al inicio (no se carga automáticamente)
  if (hourContentPanel) hourContentPanel.style.display = 'none';

  // Cargar notas generales
  if (generalNotesText && SCHEDULE_DATA.generalNotes) {
    generalNotesText.innerHTML = SCHEDULE_DATA.generalNotes.replace(/\n/g, '<br>');
  }

  // ─── DATOS DE PRUEBAS DE DIAGNÓSTICO (2º ESO) ───────────────────────────────
  // Tabla de aula por grupo para las pruebas de diagnóstico
  const DIAGNOSTICO = {
    '2eso_a': { horas: [1], aula: '35', nota: 'Aula 35 – Pruebas de Diagnóstico (1ª hora)' },
    '2eso_b': { horas: [4], aula: '35', nota: 'Aula 35 – Pruebas de Diagnóstico (4ª hora)' },
    '2eso_c': { horas: [3], aula: '35', nota: 'Aula 35 – Pruebas de Diagnóstico (3ª hora)' },
    '2eso_d': { horas: [3], aula: '34', nota: 'Aula 34 – Pruebas de Diagnóstico (3ª hora)' },
    '2eso_e': { horas: [1], aula: '34', nota: 'Aula 34 – Pruebas de Diagnóstico (1ª hora)' },
  };

  // ─── LISTA DE CURSOS ─────────────────────────────────────────────────────────
  const COURSES = [
    { id: '1eso_a', name: '1º ESO A', query: '1º ESO A' },
    { id: '1eso_b', name: '1º ESO B', query: '1º ESO B' },
    { id: '1eso_c', name: '1º ESO C', query: '1º ESO C' },
    { id: '2eso_a', name: '2º ESO A', query: '2º ESO A' },
    { id: '2eso_b', name: '2º ESO B', query: '2º ESO B' },
    { id: '2eso_c', name: '2º ESO C', query: '2º ESO C' },
    { id: '2eso_d', name: '2º ESO D', query: '2º ESO D' },
    { id: '2eso_e', name: '2º ESO E', query: '2º ESO E' },
    { id: '3eso_a', name: '3º ESO A', query: '3º ESO A' },
    { id: '3eso_b', name: '3º ESO B', query: '3º ESO B' },
    { id: '3eso_c', name: '3º ESO C', query: '3º ESO C' },
    { id: '4eso_a', name: '4º ESO A', query: '4º ESO A' },
    { id: '4eso_b', name: '4º ESO B', query: '4º ESO B' },
    { id: '4eso_c', name: '4º ESO C', query: '4º ESO C' },
    { id: 'enclave', name: 'Aula Enclave', query: 'Enclave' },
    { id: 'bach_ciclos', name: 'Bachillerato y Ciclos', query: 'BACH' }
  ];

  // ─── SELECTOR DE CURSOS (TIMELINE) ───────────────────────────────────────────
  if (courseSelectorGrid) {
    courseSelectorGrid.innerHTML = COURSES.map(course => `
      <button class="course-btn" data-course-id="${course.id}" data-query="${course.query}">
        ${course.name}
      </button>
    `).join('');

    courseSelectorGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.course-btn');
      if (!btn) return;

      // Toggle: si ya está activo, lo desactivamos y ocultamos el timeline
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        selectedCourse = null;
        if (timelineDisplay) timelineDisplay.style.display = 'none';
        if (emptyTimelineState) emptyTimelineState.style.display = 'block';
        return;
      }

      document.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const courseId = btn.dataset.courseId;
      const course = COURSES.find(c => c.id === courseId);
      selectedCourse = course;

      renderCourseTimeline(course);
    });
  }

  // ─── SELECTOR DE HORAS (TABS) ─────────────────────────────────────────────────
  if (hourTabsContainer) {
    const hours = [1, 2, 3, 4, 5, 6];
    // Ningún botón activo al inicio
    hourTabsContainer.innerHTML = hours.map(h => `
      <button class="nav-tab-btn" data-hour="${h}">
        🕒 ${h}ª Hora
      </button>
    `).join('');

    hourTabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-tab-btn');
      if (!btn) return;

      const clickedHour = parseInt(btn.dataset.hour);

      // Toggle: si ya está activo, se desactiva y se oculta la tabla
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        currentHour = null;
        if (hourContentPanel) hourContentPanel.style.display = 'none';
        if (emptyHourState) emptyHourState.style.display = 'block';
        return;
      }

      // Activar el botón pulsado
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentHour = clickedHour;

      // Mostrar el panel y renderizar
      if (emptyHourState) emptyHourState.style.display = 'none';
      if (hourContentPanel) hourContentPanel.style.display = 'block';
      renderHourTable();
    });
  }

  // ─── MODO OSCURO ──────────────────────────────────────────────────────────────
  const savedDarkMode = localStorage.getItem('dark_mode') === 'true';
  if (savedDarkMode) {
    document.body.classList.add('dark-mode');
    if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('dark_mode', isDark);
      themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // ─── MODO PROYECTOR ───────────────────────────────────────────────────────────
  const projectorToggleBtn = document.getElementById('projector-toggle-btn');
  const savedProjectorMode = localStorage.getItem('projector_mode') === 'true';
  const htmlRoot = document.documentElement;
  
  if (savedProjectorMode) {
    htmlRoot.classList.add('projector-mode');
    if (projectorToggleBtn) projectorToggleBtn.innerHTML = '📽️ Quitar ZOOM del aula';
  }

  if (projectorToggleBtn) {
    projectorToggleBtn.addEventListener('click', () => {
      const isProjector = htmlRoot.classList.toggle('projector-mode');
      localStorage.setItem('projector_mode', isProjector);
      
      projectorToggleBtn.innerHTML = isProjector ? '📽️ Quitar ZOOM del aula' : '📽️ Clic aquí para proyectar en el aula y hacer ZOOM';
      
      // Animación al botón
      projectorToggleBtn.style.transform = 'scale(1.05)';
      setTimeout(() => projectorToggleBtn.style.transform = 'scale(1)', 200);
    });
  }

  // ─── RENDER TABLA POR HORA ────────────────────────────────────────────────────
  function renderHourTable() {
    if (currentHour === null) return;

    const filtered = SCHEDULE_DATA.activities.filter(act => act.hour === currentHour);

    // Actualizar encabezados
    if (activeHourTitle && activeHourBadge) {
      const labels = {
        1: '1ª Hora — 8:00 a 8:55',
        2: '2ª Hora — 8:55 a 9:50',
        3: '3ª Hora — 9:50 a 10:45',
        4: '4ª Hora — 11:15 a 12:10',
        5: '5ª Hora — 12:10 a 13:05',
        6: '6ª Hora — 13:05 a 13:45'
      };
      activeHourTitle.textContent = labels[currentHour];
      activeHourBadge.textContent = `Franja ${currentHour}`;
      activeHourBadge.style.background = 'var(--primary-color)';
      activeHourBadge.style.color = 'white';
    }

    if (filtered.length === 0) {
      const noResultsHTML = `
        <tr>
          <td colspan="6" class="no-results">
            <div class="no-results-icon">📅</div>
            <p>No se encontraron actividades programadas para esta hora.</p>
          </td>
        </tr>
      `;
      if (scheduleTableBody) scheduleTableBody.innerHTML = noResultsHTML;
      if (mobileCardsContainer) {
        mobileCardsContainer.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📅</div>
            <p>No se encontraron actividades programadas para esta hora.</p>
          </div>
        `;
      }
      return;
    }

    // Renderizar para Desktop (Tabla) — SIN columna Franja, grupos como texto plano
    if (scheduleTableBody) {
      let lastObs = null;

      scheduleTableBody.innerHTML = filtered.map(act => {
        const isStarred = starredActivities.includes(act.id);
        const starClass = isStarred ? 'active' : '';
        const starIcon = isStarred ? '★' : '☆';

        const currentObs = act.observations.replace(/ \| /g, '<br>');

        return `
          <tr data-id="${act.id}">
            <td>
              <div class="zone-cell">
                <span class="zone-icon">📍</span>
                <span>${act.zone.replace(/ \| /g, '<br>')}</span>
              </div>
            </td>
            <td class="action-cell">${act.action.replace(/ \| /g, '<br>')}</td>
            <td class="groups-cell">${formatGroupsPlain(act.groups)}</td>
            <td class="obs-cell">${currentObs}</td>
            <td style="text-align: center;">
              <button class="starred-btn ${starClass}" data-id="${act.id}" title="Marcar como favorita">
                ${starIcon}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Renderizar para Móvil (Cards)
    if (mobileCardsContainer) {
      mobileCardsContainer.innerHTML = filtered.map(act => {
        const isStarred = starredActivities.includes(act.id);
        const starClass = isStarred ? 'active' : '';
        const starIcon = isStarred ? '★' : '☆';

        return `
          <div class="mobile-card" data-id="${act.id}">
            <div class="mobile-card-header">
              <div class="mobile-card-zone">📍 ${act.zone}</div>
              <button class="starred-btn ${starClass}" data-id="${act.id}">
                ${starIcon}
              </button>
            </div>
            <div class="mobile-card-action">${act.action}</div>

            <div class="mobile-card-field">
              <div class="mobile-card-label">Horario:</div>
              <div class="mobile-card-value"><strong>${act.timeSlot}</strong> (${act.hourLabel})</div>
            </div>

            <div class="mobile-card-field">
              <div class="mobile-card-label">Grupos Participantes:</div>
              <div class="mobile-card-value">${formatGroupsPlain(act.groups)}</div>
            </div>

            <div class="mobile-card-field">
              <div class="mobile-card-label">Docente Acompañante:</div>
              <div class="mobile-card-value">${act.teachers || 'No especificado'}</div>
            </div>

            ${act.observations ? `
              <div class="mobile-card-field">
                <div class="mobile-card-label">Observaciones:</div>
                <div class="mobile-card-value" style="color: var(--text-muted);">${act.observations}</div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    addStarEvents();
  }

  // ─── GRUPOS COMO TEXTO PLANO (sin badges, sin cajitas) ───────────────────────
  function formatGroupsPlain(groupsText) {
    if (!groupsText || groupsText.trim() === '') return '<em style="color:var(--text-muted)">No especificado</em>';
    // Reemplazar separadores " | " por saltos de línea legibles
    return groupsText.split(/ \| /).map(p => p.trim()).filter(Boolean).join('<br>');
  }

  // ─── FAVORITOS ────────────────────────────────────────────────────────────────
  function addStarEvents() {
    document.querySelectorAll('.starred-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const index = starredActivities.indexOf(id);

        if (index > -1) {
          starredActivities.splice(index, 1);
        } else {
          starredActivities.push(id);
        }

        localStorage.setItem('starred_activities', JSON.stringify(starredActivities));

        document.querySelectorAll(`.starred-btn[data-id="${id}"]`).forEach(b => {
          const isNowStarred = starredActivities.includes(id);
          b.textContent = isNowStarred ? '★' : '☆';
          b.classList.toggle('active', isNowStarred);
        });
      });
    });
  }

  // ─── LÓGICA DE PERTENENCIA AL CURSO ──────────────────────────────────────────
  function isActivityForCourse(act, course) {
    const groupsText = act.groups.toLowerCase();
    const obsText = act.observations.toLowerCase();
    const courseQuery = course.query.toLowerCase();
    const courseName = course.name.toLowerCase();

    // 1. Eventos colectivos (Todos los grupos)
    if (groupsText.includes('todo el alumnado') || groupsText.includes('todos los grupos')) {
      if (groupsText.includes('excepto') && groupsText.includes(courseName)) return false;
      return true;
    }

    // 2. Coincidencia directa
    const normalizedQuery = courseQuery.replace(/\s+/g, '');
    const normalizedName = courseName.replace(/\s+/g, '');
    const normalizedGroups = groupsText.replace(/\s+/g, '');
    const normalizedObs = obsText.replace(/\s+/g, '');

    if (normalizedGroups.includes(normalizedQuery) || normalizedGroups.includes(normalizedName) ||
        normalizedObs.includes(normalizedQuery) || normalizedObs.includes(normalizedName)) {
      return true;
    }

    // 3. Coincidencia por nivel ESO
    const matchEso = courseName.match(/^(\dº\s*eso)/i);
    if (matchEso) {
      const levelString = matchEso[1].replace(/\s+/g, '');
      if (normalizedGroups.includes(levelString) || normalizedObs.includes(levelString)) {
        const letter = courseName.slice(-1);
        const lettersInCell = [];
        if (normalizedGroups.includes(levelString + 'a')) lettersInCell.push('a');
        if (normalizedGroups.includes(levelString + 'b')) lettersInCell.push('b');
        if (normalizedGroups.includes(levelString + 'c')) lettersInCell.push('c');
        if (normalizedGroups.includes(levelString + 'd')) lettersInCell.push('d');
        if (normalizedGroups.includes(levelString + 'e')) lettersInCell.push('e');

        if (lettersInCell.length > 0 && !lettersInCell.includes(letter)) return false;
        return true;
      }
    }

    // 4. Casos especiales
    if (course.id === 'enclave' && (groupsText.includes('enclave') || obsText.includes('enclave'))) return true;
    if (course.id === 'bach_ciclos' && (groupsText.includes('bach') || groupsText.includes('ciclos') ||
        obsText.includes('bach') || obsText.includes('ciclos'))) return true;

    return false;
  }

  // ─── RENDER TIMELINE POR CURSO ────────────────────────────────────────────────
  function renderCourseTimeline(course) {
    if (!course) return;

    if (emptyTimelineState) emptyTimelineState.style.display = 'none';
    if (timelineDisplay) timelineDisplay.style.display = 'block';

    if (selectedCourseTitle) {
      selectedCourseTitle.textContent = `Jornada del Día de Canarias — ${course.name}`;
    }

    const diagInfo = DIAGNOSTICO[course.id] || null;

    const hours = [1, 2, 3, 4, 5, 6];
    const hourLabels = {
      1: '1ª Hora | 8:00 – 8:55',
      2: '2ª Hora | 8:55 – 9:50',
      3: '3ª Hora | 9:50 – 10:45',
      4: '4ª Hora | 11:15 – 12:10',
      5: '5ª Hora | 12:10 – 13:05',
      6: '6ª Hora | 13:05 – 13:45'
    };

    const timelineHTML = hours.map(h => {
      let cardsHTML = '';

      // ── PRUEBAS DE DIAGNÓSTICO (2º ESO) ──────────────────────────────────────
      // Si esta hora es una hora de diagnóstico para este curso, se muestra primero
      const esDiagnostico = diagInfo && diagInfo.horas.includes(h);

      if (esDiagnostico) {
        cardsHTML = `
          <div class="timeline-card" style="border-left: 4px solid #e07b00;">
            <div class="timeline-title" style="color: #c06000;">
              <span>📋 Pruebas de Diagnóstico</span>
              <span class="timeline-zone-tag" style="background:#fff3e0; color:#c06000; border-color:#e07b00;">🏫 Aula ${diagInfo.aula}</span>
            </div>
            <div class="timeline-details">
              <div class="timeline-obs" style="background: #fff8f0; padding: 1rem; border-radius: 8px;">
                <strong>Detalles:</strong> Durante esta hora el grupo realiza las <strong>Pruebas de Diagnóstico</strong> oficiales. Acudir puntualmente al aula indicada. No participar en las actividades de la jornada durante este tramo.
                <br><small style="color: #c06000; font-weight: 800; font-size: 0.95rem; display: block; margin-top: 5px;">NOTAS: Examen oficial</small>
              </div>
              <div>
                <div class="timeline-detail-label">PROFESOR ASIGNADO:</div>
                <div class="timeline-detail-val">👤 Docente asignado a la prueba</div>
              </div>
            </div>
          </div>
        `;
        return `
          <div class="timeline-item">
            <div class="timeline-badge-node" style="border-color: #e07b00;"></div>
            <div class="timeline-time" style="color:#c06000;">🕒 ${hourLabels[h]}</div>
            ${cardsHTML}
          </div>
        `;
      }

      // ── CASO ESPECIAL: 2º ESO A ───────────────────────────────────────────────
      // El resto de horas (1, 2, 5, 6) usan la lógica general (Pruebas, Ventorrillos, Acto Principal)
      if (course.id === '2eso_a' && (h === 3 || h === 4)) {
        const cardsHTML = `
          <div class="timeline-card" style="border-left: 4px solid #7c3aed;">
            <div class="timeline-title" style="color: #5b21b6;">
              <span>🎭 Obra de Teatro (${course.name})</span>
              <span class="timeline-zone-tag" style="background:#ede9fe; color:#5b21b6; border-color:#7c3aed;">🎭 Salón de Actos</span>
            </div>
            <div class="timeline-details">
              <div class="timeline-obs" style="background: rgba(124, 58, 237, 0.05); padding: 1rem; border-radius: 8px;">
                <strong>Detalles:</strong> En esta hora el grupo de ${course.name} presenta su <strong>obra de teatro propia</strong>. Acudir al Salón de Actos con puntualidad.
                <br><small style="color: #5b21b6; font-weight: 800; font-size: 0.95rem; display: block; margin-top: 5px;">NOTAS: Actividad propia</small>
              </div>
              <div>
                <div class="timeline-detail-label">PROFESOR ASIGNADO:</div>
                <div class="timeline-detail-val">👤 Docentes que tienen Clases con el alumnado en esta franja horaria</div>
              </div>
            </div>
          </div>
        `;
        return `
          <div class="timeline-item">
            <div class="timeline-badge-node"></div>
            <div class="timeline-time">🕒 ${hourLabels[h]}</div>
            ${cardsHTML}
          </div>
        `;
      }

      // ── LÓGICA GENERAL (resto de cursos) ─────────────────────────────────────
      const actsInHour = SCHEDULE_DATA.activities.filter(act => act.hour === h && isActivityForCourse(act, course));

      if (actsInHour.length === 0) {
        // Defaults inteligentes por hora
        let defaultAction = 'Permanencia en Aula / Actividad General';
        let defaultZone = 'Aula de Grupo';
        let defaultObs = 'El grupo permanece con el docente asignado en su aula o realiza visitas rotativas supervisadas.';
        let defaultTeacher = 'Docente de guardia o asignatura en esta franja';

        if (h === 2) {
          defaultAction = 'Desayuno de Ventorrillos y Ofrenda Solidaria';
          defaultZone = (course.id.includes('1eso') || course.id.includes('2eso') || course.id === 'enclave') ? 'Mesas de Jardines' : 'Canchas del Centro';
          defaultObs = 'Preparamos la ofrenda para el Banco de Alimentos en la mesa de nuestro grupo y disfrutamos del desayuno canario.';
          defaultTeacher = 'Docente correspondiente de 2ª Hora';
        } else if (h === 5) {
          if (course.id === '1eso_a') {
            defaultAction = 'Taller de Ilustración (Aula Plástica) y Acto Principal';
            defaultZone = 'Aula Plástica / Patio Central';
            defaultObs = 'De 12:10 a 12:50 en el Aula Plástica. A las 12:50 se incorpora al Acto Principal en el Patio Central.';
            defaultTeacher = 'Docentes con clase en 5ª Hora';
          } else {
            defaultAction = 'Acto Principal (Festival)';
            defaultZone = 'Patio Central';
            defaultObs = 'Asistencia y participación en el Acto Principal del Día de Canarias.';
            defaultTeacher = 'Todos los docentes correspondientes';
          }
        } else if (h === 6) {
          defaultAction = 'Acto Principal y Verbena de Fin de Jornada';
          defaultZone = 'Patio Central';
          defaultObs = 'Baile, verbena final y clausura de la jornada escolar del Día de Canarias.';
          defaultTeacher = 'Todos los docentes correspondientes';
        }

        cardsHTML = buildDefaultCard(defaultAction, defaultZone, defaultTeacher, defaultObs);
      } else {
        cardsHTML = actsInHour.map(act => {
          let displayAction = act.action;
          let displayObs = act.observations;

          const timeMatch = act.groups.match(/(\d{1,2}:\d{2}\s*a\s*\d{1,2}:\d{2})/i);
          if (timeMatch) {
            displayAction = `${act.action} (${timeMatch[1]})`;
          }

          return `
            <div class="timeline-card" style="border-left: 4px solid var(--primary-color); margin-bottom: 0.5rem;">
              <div class="timeline-title">
                <span>${displayAction}</span>
                <span class="timeline-zone-tag">📍 ${act.zone}</span>
              </div>
              <div class="timeline-details">
                <div class="timeline-obs" style="background: rgba(0, 123, 192, 0.05); padding: 1rem; border-radius: 8px; color: var(--text-color); font-weight: 600;">
                  <strong>Detalles:</strong> ${displayObs}
                  <br><small style="color: var(--primary-color); font-weight: 800; font-size: 0.95rem; display: block; margin-top: 5px;">NOTAS: ${act.groups}</small>
                </div>
                <div>
                  <div class="timeline-detail-label">PROFESOR ASIGNADO:</div>
                  <div class="timeline-detail-val">👤 ${act.teachers || 'Profesor de la hora correspondiente'}</div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      if (h === 1) {
        cardsHTML += `
          <div class="alert-box" style="background:#fee2e2; border:2px solid #ef4444; color:#b91c1c; padding:15px; border-radius:8px; margin-top:10px; font-weight:800; font-size:1.1rem; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);">
            ⚠️ ATENCIÓN: A las 8:25 solo baja una selección de alumnado.
          </div>
        `;
      }

      if (h === 2) {
        cardsHTML += `
          <div class="timeline-card" style="border-left: 4px solid var(--info-color); margin-top: 1.5rem; margin-bottom: 0.5rem;">
            <div class="timeline-title" style="color: var(--info-color);">
              <span>Preparar los talleres | A las 9:25</span>
              <span class="timeline-zone-tag" style="background:rgba(59, 130, 246, 0.1); color:var(--info-color); border-color:var(--info-color);">📍 Trasera Talleres | Jardín de la Biblioteca</span>
            </div>
            <div class="timeline-details">
              <div class="timeline-obs" style="background: rgba(59, 130, 246, 0.05); padding: 1rem; border-radius: 8px; color: var(--text-color); font-weight: 600;">
                <strong>Detalles:</strong> A las 9:25 va solamente el alumnado que imparte talleres. | En los puestos estarán los coordinadores del DAC y Red INNOVAS, además de docentes que imparten talleres.
                <br><small style="color: var(--info-color); font-weight: 800; font-size: 0.95rem; display: block; margin-top: 5px;">NOTAS: Actividad específica</small>
              </div>
              <div>
                <div class="timeline-detail-label">PROFESOR ASIGNADO:</div>
                <div class="timeline-detail-val">👤 Docentes que imparten talleres</div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="timeline-item">
          <div class="timeline-badge-node"></div>
          <div class="timeline-time">🕒 ${hourLabels[h]}</div>
          ${cardsHTML}
        </div>
      `;
    }).join('');

    if (timelineItemsContainer) {
      timelineItemsContainer.innerHTML = timelineHTML;
    }
  }

  // ─── HELPER: tarjeta de actividad por defecto ─────────────────────────────────
  function buildDefaultCard(action, zone, teacher, obs) {
    return `
      <div class="timeline-card" style="border-left: 4px solid var(--text-muted);">
        <div class="timeline-title" style="color: var(--text-muted);">
          <span>${action}</span>
          <span class="timeline-zone-tag" style="background:var(--border-color); color:var(--text-muted); border-color:var(--text-muted);">📍 ${zone}</span>
        </div>
        <div class="timeline-details">
          <div class="timeline-obs" style="background: var(--bg-color); padding: 1rem; border-radius: 8px; border: 1px dashed var(--border-color);">
            <strong>Detalles:</strong> ${obs}
            <br><small style="color: var(--text-muted); font-weight: 800; font-size: 0.95rem; display: block; margin-top: 5px;">NOTAS: Actividad Regular / General</small>
          </div>
          <div>
            <div class="timeline-detail-label">PROFESOR ASIGNADO:</div>
            <div class="timeline-detail-val">👤 ${teacher}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── IMPRIMIR TIMELINE ────────────────────────────────────────────────────────
  if (printTimelineBtn) {
    printTimelineBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // NO se llama a renderHourTable() aquí — la tabla empieza oculta
});
