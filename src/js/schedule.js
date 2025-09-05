import '../css/styles.css';
// @ts-expect-error Ignore missing types
import * as jsyaml from 'js-yaml';

// French: 300
// Social studies: 100
// Science: 100
// Visual arts: 60
// Drama: 40
// Music: 40

// const yamlText = `
// Start: 8:00 AM
// End: 2:30 PM
// Colors:
//   Invariants: "lightgray"
//   French: "lightblue"
//   Math: "lightgreen"
// Invariants:
//   - Block: First Recess
//     Time: 10:00 AM - 10:25 AM
//   - Block: First Nutrition Break
//     Time: 10:25 AM - 10:45 AM

//   - Block: Second Recess
//     Time: 12:45 PM - 1:10 PM
//   - Block: Second Nutrition Break
//     Time: 1:10 PM - 1:30 PM

// Monday:
//   - Block: French
//     Time: 8:00 AM - 10:00 AM
//   - Block: Math
//     Time: 11:00 AM - 12:15 PM

// Tuesday:
//   - Block: Math
//     Time: 8:00 AM - 9:00 AM
// `;

// Days of the week constant
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const INTERVAL = 15;
/** @type {Record<string, number>} */
const totalMinutesMap = {};

// Function to convert time to minutes past midnight
/**
 * @param {string} time
 * @returns {number}
 */
const timeToMinutes = (time) => {
    const match = /(\d+):(\d+) (\w+)/.exec(time);
    if (!match) throw new Error(`Invalid time format: ${time}`);
    const [, hours, minutes, period] = match;
    let totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    if (period.toUpperCase() === 'PM' && parseInt(hours) !== 12) {
      totalMinutes += 12 * 60;
    }
    return totalMinutes;
};

// Function to convert minutes past midnight to a time string
/**
 * @param {number} minutes
 * @returns {string}
 */
const minutesToTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hrs < 12 ? 'AM' : 'PM';
    const adjustedHrs = hrs === 0 ? 12 : (hrs > 12 ? hrs - 12 : hrs);
    return `${String(adjustedHrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
  };

  /**
   * @param {any} data
   * @returns {any[]}
   */
  const createTimeBlockList = (data) => {
    const timeBlockList = [];
    const startTime = timeToMinutes(data.Start);
    const endTime = timeToMinutes(data.End);
  
    for (let minutes = startTime; minutes <= endTime; minutes += INTERVAL) {
      const timeBlock = {};
      DAYS_OF_WEEK.forEach(day => {
        const allBlocksForDay = data[day] || [];
        allBlocksForDay.forEach(/** @type {function(any): void} */ (block) => {
          const [start, end] = block.Time.split(' - ');
          const startMinutes = timeToMinutes(start);
          const endMinutes = timeToMinutes(end);
  
          if (startMinutes === minutes) {
            (/** @type {any} */ (timeBlock))[day] = { Block: block.Block, Duration: endMinutes - startMinutes };
            totalMinutesMap[block.Block] = (totalMinutesMap[block.Block] || 0) + (endMinutes - startMinutes);
          }
        });
      });
      timeBlockList.push(timeBlock);
    }
    return timeBlockList;
  };
  
  /**
   * @param {any} data
   * @returns {HTMLTableElement}
   */
  const createTable = (data) => {
    const table = document.createElement('table');
    table.setAttribute('border', '1');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Time', ...DAYS_OF_WEEK].forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    const timeBlockList = createTimeBlockList(data);
    const tbody = document.createElement('tbody');
    const currentTime = timeToMinutes(data.Start);
    const endTime = timeToMinutes(data.End);
  
    for (let minutes = currentTime; minutes <= endTime; minutes += INTERVAL) {
      const row = document.createElement('tr');
      const timeCell = document.createElement('td');
      const timeBlock = timeBlockList[(minutes - currentTime) / INTERVAL] || {};
      const invariantBlock = data.Invariants && data.Invariants.find(/** @type {function(any): boolean} */ (block) => {
        const [start, ] = block.Time.split(' - ');
        return timeToMinutes(start) === minutes;
      });
  
      if (invariantBlock) {
        timeCell.textContent = invariantBlock.Time;
        const invariantCell = document.createElement('td');
        invariantCell.textContent = invariantBlock.Block;
        invariantCell.colSpan = DAYS_OF_WEEK.length;
        invariantCell.rowSpan = 1;
        invariantCell.style.backgroundColor = data.Colors && data.Colors.Invariants || 'lightgray';
        const [start, end] = invariantBlock.Time.split(' - ');
        minutes += timeToMinutes(end) - timeToMinutes(start) - INTERVAL;
        row.appendChild(timeCell);
        row.appendChild(invariantCell);
      } else {
        timeCell.textContent = minutesToTime(minutes);
        row.appendChild(timeCell);
        DAYS_OF_WEEK.forEach((day) => {
          const dayCell = document.createElement('td');
          if (timeBlock[day]) {
            dayCell.textContent = timeBlock[day].Block;
            dayCell.rowSpan = timeBlock[day].Duration / INTERVAL;
            dayCell.style.backgroundColor = data.Colors && data.Colors[timeBlock[day].Block] || 'white';
            row.appendChild(dayCell);
          }
        });
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    return table;
};

// Create the summary table
const createSummaryTable = () => {
    const summaryTable = document.createElement('table');
    summaryTable.setAttribute('border', '1');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Block', 'Total Minutes'].forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    summaryTable.appendChild(thead);
    const tbody = document.createElement('tbody');
    Object.keys(totalMinutesMap).forEach((block) => {
      const row = document.createElement('tr');
      const blockCell = document.createElement('td');
      blockCell.textContent = block;
      row.appendChild(blockCell);
      const minutesCell = document.createElement('td');
      minutesCell.textContent = String(totalMinutesMap[block]);
      row.appendChild(minutesCell);
      tbody.appendChild(row);
    });
    summaryTable.appendChild(tbody);
    return summaryTable;
};
  
const renderTables = () => {
    const yamlTextarea = /** @type {HTMLTextAreaElement} */ (document.getElementById('yaml-textarea'));
    if (!yamlTextarea) return;
    const yamlText = yamlTextarea.value;
    try {
    const data = jsyaml.load(yamlText);
    Object.keys(totalMinutesMap).forEach(key => {
        delete totalMinutesMap[key];
    });
    const table = createTable(data);
    const summaryTable = createSummaryTable();
    const container = document.getElementById('tables-container');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(table);
    container.appendChild(summaryTable);
    }
    catch (e) {
        // Handle the error by displaying a message to the user
        const errorMessage = document.createElement('p');
        errorMessage.textContent = "Invalid YAML: " + (/** @type {Error} */ (e)).message;
        const container = document.getElementById('tables-container');
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(errorMessage);
    }
};
  
const yamlTextarea = document.getElementById('yaml-textarea');
if (yamlTextarea) {
    yamlTextarea.addEventListener('input', renderTables);
}
renderTables();