<script>
  export let data;
  export let min;
  export let max;

  function sanitize() {
    if (data === "" || data === undefined || data === null) {
      return;
    }
    const numericValue = Number(data);
    if (!Number.isFinite(numericValue)) {
      return;
    }
    let nextValue = Math.trunc(numericValue);
    const parsedMin = Number(min);
    const parsedMax = Number(max);
    if (Number.isFinite(parsedMin)) {
      nextValue = Math.max(nextValue, parsedMin);
    }
    if (Number.isFinite(parsedMax)) {
      nextValue = Math.min(nextValue, parsedMax);
    }
    data = nextValue;
  }
</script>

<input
  type="number"
  step="1"
  bind:value={data}
  min={min}
  max={max}
  on:blur={sanitize}
/>

<style>
  input {
    padding: 5px 5px 5px 5px;
    box-sizing: border-box;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    font-size: 13px;
    border: 1px solid var(--vscode-input-border);
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    width: 100%;
    height: 100%;
  }
</style>
