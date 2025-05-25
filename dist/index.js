(() => {
  // src/index.ts
  if (localStorage.getItem("agentInfo")) {
    window.location.replace("peer-connection.html");
  }
  var agentInfoForm = document.querySelector("form[name='agent']");
  if (agentInfoForm) {
    agentInfoForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const agentInfoInput = document.querySelector("form[name='agent'] > input");
      if (agentInfoInput && agentInfoInput instanceof HTMLInputElement) {
        agentInfoInput.disabled = true;
        const agentInfo = {
          id: `agent-${Math.random()}`,
          name: agentInfoInput.value.trim()
        };
        localStorage.setItem("agent", JSON.stringify(agentInfo));
        window.location.href = "peer-connection.html";
      }
    });
  }
})();
