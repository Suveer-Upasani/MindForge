export default function DefectExplanationCard({ result }) {
  if (!result) return null;

  const isPass = result.status === 'pass';

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
      <h3 className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-6">Automated Finding Details</h3>
      
      <div className="space-y-6">
        <div className="bg-teal-50/30 p-4 rounded-xl border border-teal-50">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Likely Issue</span>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">{result.likelyIssue}</p>
        </div>
        
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suggested Action</span>
          <p className="text-sm text-slate-800 leading-relaxed italic">
            {isPass 
              ? 'No action required. Product meets industrial standards.' 
              : 'Manual review recommended at workstation 4 before final packaging. Isolate product from batch.'}
          </p>
        </div>
      </div>
    </div>
  );
}

