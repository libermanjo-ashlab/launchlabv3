import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set) => ({
      token:    null,
      user:     null,
      setAuth:  (token, user) => set({ token, user }),
      clearAuth: () => set({ token:null, user:null, currentBusinessId:null }),

      currentBusinessId: null,
      setCurrentBusiness: (id) => set({ currentBusinessId: id }),

      intake: { location:"", hours:15, budget:1000, skills:[], assets:[], risk:"medium", incomeGoal:"", ownIdea:"", businessExperience:"", age:null },
      setIntake: (updates) => set(s => ({ intake: { ...s.intake, ...updates } })),
      resetIntake: () => set({ intake: { location:"", hours:15, budget:1000, skills:[], assets:[], risk:"medium", incomeGoal:"", ownIdea:"", businessExperience:"", age:null } }),

      ideas:       [],
      selectedIdea: null,
      setIdeas:        (ideas) => set({ ideas }),
      setSelectedIdea: (idea)  => set({ selectedIdea: idea }),

      businesses: [],
      setBusinesses:  (b) => set({ businesses: b }),
      updateBusiness: (id, u) => set(s => ({ businesses: s.businesses.map(b => b.id===id?{...b,...u}:b) })),
      addBusiness:    (b) => set(s => ({ businesses: [b, ...s.businesses] })),

      tasks: {},
      setTasks:     (bizId, t) => set(s => ({ tasks: {...s.tasks, [bizId]:t} })),
      updateTask:   (bizId, id, u) => set(s => ({ tasks: {...s.tasks, [bizId]:(s.tasks[bizId]||[]).map(t=>t.id===id?{...t,...u}:t)} })),
      addTask:      (bizId, t) => set(s => ({ tasks: {...s.tasks, [bizId]:[...(s.tasks[bizId]||[]),t]} })),
      removeTask:   (bizId, id) => set(s => ({ tasks: {...s.tasks, [bizId]:(s.tasks[bizId]||[]).filter(t=>t.id!==id)} })),

      hubModes: {},
      setHubMode: (bizId, stage, mode) => set(s => ({ hubModes: {...s.hubModes, [bizId]:{...(s.hubModes[bizId]||{}), [stage]:mode}} })),
    }),
    {
      name: "launchlab",
      partialize: s => ({ token:s.token, user:s.user, intake:s.intake, currentBusinessId:s.currentBusinessId }),
    }
  )
);

export default useStore;
