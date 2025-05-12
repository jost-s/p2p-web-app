if (localStorage.getItem("agentInfo")) {
  window.location.replace("peer-connection.html");
}

const agentInfoForm = document.querySelector("form[name='agent-info']");
if (agentInfoForm) {
  agentInfoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const agentInfoInput = document.querySelector(
      "form[name='agent-info'] > input"
    );
    if (agentInfoInput && agentInfoInput instanceof HTMLInputElement) {
      agentInfoInput.disabled = true;
      const agentInfo = { id: agentInfoInput.value.trim() };
      localStorage.setItem("agentInfo", JSON.stringify(agentInfo));
      window.location.href = "peer-connection.html";
    }
  });
}
