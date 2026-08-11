// commitMessageScript.js
const { execSync } = require('child_process');
const os = require('os');

try {
  const MAX_CONTRIBUTORS = 3; // Сколько имён показывать
  const DAYS = 30;            // Сколько дней назад учитывать коммиты

  // Текущая дата и время
  const now = new Date();
  const pad = (n) => (n < 10 ? '0' + n : n);
  const dateString = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Имя хоста
  const hostname = os.hostname();

  // Получаем изменённые файлы
  let changedFiles = [];
  try {
    const filesOutput = execSync('git status --porcelain').toString().trim();
    if (filesOutput) {
      changedFiles = filesOutput.split('\n').map(line => line.slice(3).trim());
    }
  } catch (e) {
    changedFiles = [];
  }

  // Собираем контрибуторов за последние DAYS дней
  const contributorsSet = new Set();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - DAYS);
  const sinceString = sinceDate.toISOString().split('T')[0]; // YYYY-MM-DD

  changedFiles.forEach(file => {
    try {
      const logOutput = execSync(`git log --since="${sinceString}" --pretty=format:"%an" -- "${file}"`).toString().trim();
      logOutput.split('\n').forEach(name => {
        if (name) contributorsSet.add(name);
      });
    } catch (e) {}
  });

  // Если нет контрибуторов, используем текущего пользователя Git
  if (contributorsSet.size === 0) {
    contributorsSet.add(execSync('git config user.name').toString().trim());
  }

  const allContributors = Array.from(contributorsSet);

  // Компактный список: максимум MAX_CONTRIBUTORS + "и ещё N"
  let contributorsText;
  if (allContributors.length <= MAX_CONTRIBUTORS) {
    contributorsText = allContributors.join(', ');
  } else {
    const displayed = allContributors.slice(0, MAX_CONTRIBUTORS).join(', ');
    const remaining = allContributors.length - MAX_CONTRIBUTORS;
    contributorsText = `${displayed}, и ещё ${remaining}`;
  }

  // Формируем единое сообщение для commit и autocommit
  const finalMessage = `${dateString} ${hostname} ${changedFiles.length} file(s) modified (${contributorsText})`;

  // Выводим его, Obsidian Git подставит в commit и autocommit
  console.log(finalMessage);

} catch (error) {
  console.error('Error generating commit message:', error);
  console.log('backup'); // fallback
}
