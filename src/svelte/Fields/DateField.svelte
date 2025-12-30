<script>
  export let data;
  export let disabled = false;

  const formatInputValue = (value) => {
    if (value === "" || value === undefined || value === null) {
      return "";
    }
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toTimestamp = (value) => {
    const [year, month, day] = value.split("-").map((v) => Number(v));
    if (!year || !month || !day) {
      return NaN;
    }
    return new Date(year, month - 1, day).getTime();
  };

  const todayStart = () => new Date().setHours(0, 0, 0, 0);

  let dateInput = formatInputValue(data);
  $: dateInput = formatInputValue(data);
  $: localeDisplay =
    data === "" || data === undefined || data === null
      ? ""
      : new Date(Number(data)).toLocaleDateString();

  function handleChange(event) {
    const value = event.target.value;
    if (value === "") {
      data = "";
      return;
    }
    const timestamp = toTimestamp(value);
    if (Number.isFinite(timestamp)) {
      data = timestamp;
    }
  }

  function setToday() {
    const now = todayStart();
    data = now;
    dateInput = formatInputValue(now);
  }
</script>

<div class="date-field">
  <input
    type="date"
    bind:value={dateInput}
    on:change={handleChange}
    {disabled}
  />
  <div class="helper">
    <span class="helper-text">{localeDisplay || "—"}</span>
    <button class="buttonIcon tiny" type="button" on:click={setToday} disabled={disabled}>
      Today
    </button>
  </div>
</div>

<style>
  .date-field input {
    padding: 5px;
    box-sizing: border-box;
    border: 1px solid var(--vscode-input-border);
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    width: 100%;
    height: 100%;
    font-size: 13px;
  }

  .helper {
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }

  .buttonIcon {
    background-color: var(--vscode-button-background);
    border: none;
    color: var(--vscode-button-foreground);
    cursor: pointer;
    padding: 4px 8px;
  }

  .buttonIcon:hover:enabled {
    background-color: var(--vscode-button-hoverBackground);
  }

  .buttonIcon:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .buttonIcon.tiny {
    padding: 3px 6px;
    font-size: 12px;
  }
</style>
