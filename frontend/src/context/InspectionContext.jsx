import { createContext, useContext, useState } from 'react';

const InspectionContext = createContext();

export const useInspection = () => useContext(InspectionContext);

const MOCK_HISTORY = [
  { id: 'INS-4920', templateName: 'Raw Denim Weave', category: 'Textile', timestamp: '2026-04-03T10:15:00Z', status: 'pass', anomalyScore: 12, severity: 'Low' },
  { id: 'INS-4919', templateName: 'Matte Ceramic 300x300', category: 'Ceramic', timestamp: '2026-04-03T09:40:00Z', status: 'fail', anomalyScore: 84, severity: 'High', likelyIssue: 'Surface Crack / Scuffed Edge' },
  { id: 'INS-4918', templateName: 'Polished Brass Sheet', category: 'Metal', timestamp: '2026-04-02T16:22:00Z', status: 'pass', anomalyScore: 18, severity: 'Low' },
  { id: 'INS-4917', templateName: 'Raw Denim Weave', category: 'Textile', timestamp: '2026-04-02T14:10:00Z', status: 'fail', anomalyScore: 65, severity: 'Medium', likelyIssue: 'Thread Pull / Weave Anomaly' },
];

export const InspectionProvider = ({ children }) => {
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [currentResult, setCurrentResult] = useState(null);

  const addInspection = (inspection) => {
    const newRecord = {
      ...inspection,
      id: `INS-${Math.floor(Math.random() * 9000) + 1000}`,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [newRecord, ...prev]);
    setCurrentResult(newRecord);
    return newRecord;
  };

  return (
    <InspectionContext.Provider value={{ history, currentResult, setCurrentResult, addInspection }}>
      {children}
    </InspectionContext.Provider>
  );
};
