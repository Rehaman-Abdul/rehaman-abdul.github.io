// Start-screen data for all eight roles. Kept separate from the role files so
// the start screen does not need to load any role content. The first three
// stakeholders here are the ones each role file must use (phase 5).
// `playable` roles have a finished content file in content/roles/.

export default [
  {
    id: "hr", title: "HR Business Partner", icon: "hr", playable: true,
    teaser: "A hiring manager keeps changing the brief, and the offer clock won't wait.",
    stakeholders: [
      { name: "Tomasz Kowalski", title: "Engineering Manager" },
      { name: "Anders Holm", title: "Director of Engineering" },
      { name: "Leilani Park", title: "VP of People" },
    ],
  },
  {
    id: "tech", title: "Software Engineer", icon: "tech", playable: true,
    teaser: "Launch is Tuesday, and the requests keep coming.",
    stakeholders: [
      { name: "Priya Raman", title: "Product Manager" },
      { name: "Marcus Lindqvist", title: "Tech Lead" },
      { name: "Sarah Mensah", title: "Director of Product" },
    ],
  },
  {
    id: "sales", title: "Account Executive", icon: "sales", playable: true,
    teaser: "The quarter closes Friday, and every deal wants one more concession.",
    stakeholders: [
      { name: "Ingrid Solheim", title: "Client Champion" },
      { name: "Tariq Hussain", title: "Sales Manager" },
      { name: "Camila Duarte", title: "Regional Sales Director" },
    ],
  },
  {
    id: "marketing", title: "Marketing Specialist", icon: "marketing", playable: true,
    teaser: "The campaign is nearly ready, and everyone has one last idea.",
    stakeholders: [
      { name: "Yuki Tanaka", title: "Product Marketing Manager" },
      { name: "Oluwaseun Adeyemi", title: "Head of Growth" },
      { name: "Elise Fontaine", title: "VP of Marketing" },
    ],
  },
  {
    id: "ops", title: "Operations Coordinator", icon: "ops", playable: true,
    teaser: "The production plan is locked, and the changes keep arriving.",
    stakeholders: [
      { name: "Mateo Alvarez", title: "Account Manager" },
      { name: "Hana Kim", title: "Procurement Manager" },
      { name: "Bjorn Eriksen", title: "Head of Operations" },
    ],
  },
  {
    id: "servicedesk", title: "Service Desk Analyst", icon: "servicedesk", playable: true,
    teaser: "Your queue is full, and everyone thinks they're the priority.",
    stakeholders: [
      { name: "Fatima Al-Sayed", title: "Office Manager" },
      { name: "Gregor Novak", title: "Senior Director" },
      { name: "Adaeze Obi", title: "COO" },
    ],
  },
  {
    id: "support", title: "Customer Support Specialist", icon: "support", playable: true,
    teaser: "The backlog is growing, and every customer is sure they're first.",
    stakeholders: [
      { name: "Noor Rahman", title: "Account Manager" },
      { name: "Stefan Petrov", title: "Team Lead" },
      { name: "Marisol Reyes", title: "Customer Success Director" },
    ],
  },
  {
    id: "finance", title: "Financial Analyst", icon: "finance", playable: true,
    teaser: "Quarter-end is close, and everyone needs numbers yesterday.",
    stakeholders: [
      { name: "Kwame Boateng", title: "Department Head" },
      { name: "Annika Larsen", title: "Operations Director" },
      { name: "Rohan Mehta", title: "CFO" },
    ],
  },
];
