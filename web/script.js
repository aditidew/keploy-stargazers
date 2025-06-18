let lastFetchedData = [];

async function fetchStargazers(mode) {
  const repo = document.getElementById('repoUrl').value.trim();
  const token = document.getElementById('token').value.trim();
  const output = document.getElementById('output');
  output.textContent = '⏳ Loading...';

  if (!repo || !token) {
    output.textContent = '❌ Please enter both the repository and the token.';
    return;
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3.star+json',
  };

  let page = 1;
  const per_page = 100;
  let allStargazers = [];
  let hasMore = true;

  try {
    while (hasMore) {
      const res = await fetch(`https://api.github.com/repos/${repo}/stargazers?per_page=${per_page}&page=${page}`, {
        headers,
      });

      if (!res.ok) {
        const err = await res.json();
        output.textContent = `❌ Error: ${res.status} - ${err.message}`;
        return;
      }

      const data = await res.json();
      if (data.length === 0) break;

      allStargazers.push(...data);
      hasMore = data.length === per_page;
      page++;
    }

    if (mode === 'recent') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      allStargazers = allStargazers.filter(user => new Date(user.starred_at) >= since);
    }

    lastFetchedData = allStargazers;
    output.textContent = JSON.stringify(allStargazers, null, 2);
  } catch (error) {
    output.textContent = `❌ Something went wrong: ${error.message}`;
  }
}

function fetchAll() {
  fetchStargazers('all');
}

function fetchRecent() {
  fetchStargazers('recent');
}

function exportToCSV() {
  if (!lastFetchedData.length) return alert("Please fetch data first.");

  const headers = Object.keys(lastFetchedData[0]).join(',');
  const rows = lastFetchedData.map(obj =>
    Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
  );
  const csvContent = [headers, ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "stargazers.csv";
  link.click();
}

function exportToExcel() {
  if (!lastFetchedData.length) return alert("Please fetch data first.");

  const ws = XLSX.utils.json_to_sheet(lastFetchedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stargazers");

  XLSX.writeFile(wb, "stargazers.xlsx");
}
