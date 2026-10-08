// Класс строки таблицы. Неактивной считается только строка с явным isActive: false
export const rowClass = (isActive?: boolean) =>
  isActive === false ? 'report-row inactive' : 'report-row'
