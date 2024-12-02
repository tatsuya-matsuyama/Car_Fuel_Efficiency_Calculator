// グローバル変数の定義
let data = []; // 燃費データを格納する配列
let chart; // グラフオブジェクト
let currentChartType = 'line'; // 現在のグラフタイプ
let editingIndex = -1; // 編集中のデータのインデックス（-1は編集モードでないことを示す）

// 距離入力の切り替え
function toggleDistanceInputs() {
    const distanceType = document.getElementById("distanceType").value;
    const odometerInputs = document.querySelector(".odometer-inputs");
    const tripInput = document.querySelector(".trip-input");
    
    if (distanceType === "odometer") {
        odometerInputs.classList.add("active");
        tripInput.classList.add("inactive");
        tripInput.value = ""; // TRIP入力をクリア
    } else {
        odometerInputs.classList.remove("active");
        tripInput.classList.remove("inactive");
    }
}

// 項目を追加する
function addRow() {
    const date = document.getElementById("date").value;
    const distance = document.getElementById("distance").value;
    const fuel = document.getElementById("fuel").value;
    const notes = document.getElementById("notes").value;
    const fuelType = document.getElementById("fuelType").value;
    
    // オドメーターの値を取得
    let distanceUsed = distance;
    if (document.getElementById("distanceType").value === "odometer") {
        const odometerBefore = document.getElementById("odometerBefore").value;
        const odometerAfter = document.getElementById("odometerAfter").value;
        if (odometerBefore && odometerAfter) {
            distanceUsed = odometerAfter - odometerBefore;
            if (distanceUsed < 0) {
                showMessage("オドメーターの終了値は開始値より大きくなければなりません。", "error");
                return;
            }
        }
    }
    
    // 燃費を計算
    const efficiency = (distanceUsed && fuel) ? (distanceUsed / fuel).toFixed(2) : 0;

    // データを追加
    const entry = {
        date: date,
        distance: distanceUsed,
        fuel: fuel,
        efficiency: efficiency,
        fuelType: fuelType,
        notes: notes
    };

    if (editingIndex >= 0) {
        data[editingIndex] = entry; // 編集の場合は上書き
        editingIndex = -1; // 編集モードを解除
    } else {
        data.push(entry); // 新しいデータを追加
    }

    updateTable();
    updateStatistics();
    updateChart();
    clearInputs();
}

// テーブルを更新
function updateTable() {
    const resultTable = document.getElementById("resultTable");
    resultTable.innerHTML = ""; // テーブルをクリア

    data.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.distance} km</td>
            <td>${entry.fuel} L</td>
            <td>${entry.efficiency} km/L</td>
            <td>${entry.fuelType}</td>
            <td>${entry.notes}</td>
            <td>
                <button onclick="editRow(${index})">編集</button>
                <button onclick="deleteRow(${index})">削除</button>
            </td>
        `;
        resultTable.appendChild(row);
    });
}

// 統計情報を更新
function updateStatistics() {
    const totalDistance = data.reduce((sum, entry) => sum + Number(entry.distance), 0);
    const totalFuel = data.reduce((sum, entry) => sum + Number(entry.fuel), 0);
    const efficiencies = data.map(entry => Number(entry.efficiency)).filter(eff => eff > 0);

    const averageEfficiency = efficiencies.length ? (efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length).toFixed(2) : 0;
    const bestEfficiency = Math.max(...efficiencies).toFixed(2);
    const worstEfficiency = Math.min(...efficiencies).toFixed(2);
    const bestEfficiencyEntry = efficiencies.indexOf(Math.max(...efficiencies));
    const worstEfficiencyEntry = efficiencies.indexOf(Math.min(...efficiencies));

    document.getElementById("averageEfficiency").innerText = averageEfficiency;
    document.getElementById("totalDistance").innerText = totalDistance;
    document.getElementById("totalFuel").innerText = totalFuel;
    document.getElementById("efficiencyRange").innerText = `${worstEfficiency} - ${bestEfficiency} km/L`;
    document.getElementById("bestEfficiency").innerText = bestEfficiency;
    document.getElementById("worstEfficiency").innerText = worstEfficiency;
    document.getElementById("bestEfficiencyDate").innerText = data[bestEfficiencyEntry]?.date || "-";
    document.getElementById("worstEfficiencyDate").innerText = data[worstEfficiencyEntry]?.date || "-";
}

// グラフを更新
function updateChart() {
    const dataRange = document.getElementById("dataRangeSelect").value;
    const limitedData = data.slice(-dataRange); // 最後のn件を取得
    const labels = limitedData.map(entry => entry.date);
    const distances = limitedData.map(entry => entry.distance);
    const fuels = limitedData.map(entry => entry.fuel);

    if (chart) {
        chart.destroy(); // 既存のグラフを破棄
    }

    const ctx = document.getElementById("fuelChart").getContext("2d");
    chart = new Chart(ctx, {
        type: currentChartType,
        data: {
            labels: labels,
            datasets: [{
                label: "使用燃料 (L)",
                data: fuels,
                backgroundColor: "rgba(75, 192, 192, 0.4)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }, {
                label: "走行距離 (km)",
                data: distances,
                backgroundColor: "rgba(255, 99, 132, 0.4)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// グラフのタイプを変更
function changeChartType(type) {
    currentChartType = type;
    updateChart();
}

// 編集行の設定
function editRow(index) {
    const entry = data[index];
    document.getElementById("date").value = entry.date;
    document.getElementById("distance").value = entry.distance;
    document.getElementById("fuel").value = entry.fuel;
    document.getElementById("notes").value = entry.notes;
    document.getElementById("fuelType").value = entry.fuelType;
    editingIndex = index; // 編集モードを設定
    toggleDistanceInputs(); // 入力タイプの表示を更新
}

// 行を削除する
function deleteRow(index) {
    if (confirm("本当に削除しますか？")) {
        data.splice(index, 1);
        updateTable();
        updateStatistics();
        updateChart();
    }
}

// データをクリアする
function clearData() {
    data = [];
    updateTable();
    updateStatistics();
    updateChart();
    clearInputs();
    showMessage("データがクリアされました。", "success");
}

// 入力フィールドをクリアする
function clearInputs() {
    document.getElementById("date").value = "";
    document.getElementById("distance").value = "";
    document.getElementById("fuel").value = "";
    document.getElementById("notes").value = "";
    document.getElementById("distanceType").value = "trip";
    toggleDistanceInputs();
}

// メッセージを表示する
function showMessage(message, type) {
    const messageDiv = document.getElementById("message");
    messageDiv.innerText = message;
    messageDiv.className = type === "error" ? "error" : "success";
    setTimeout(() => {
        messageDiv.innerText = "";
    }, 3000);
}

// データをエクスポートする
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fuel_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// データをインポートする
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                data = importedData;
                updateTable();
                updateStatistics();
                updateChart();
                showMessage("データが正常にインポートされました。", "success");
            } else {
                showMessage("インポートされたデータが無効です。", "error");
            }
        } catch (error) {
            showMessage("エラーが発生しました。無効なファイルです。", "error");
        }
    };
    reader.readAsText(file);
}