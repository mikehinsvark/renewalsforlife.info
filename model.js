(function(root){
 'use strict';
 function calculateScenario(income,years,retention=100){
  const rows=[];let renewal=0,totalTransactional=0,totalRenewal=0;
  for(let year=1;year<=50;year++){
   const transactional=year<=years?income:0;
   renewal=renewal*(retention/100)+(year<=years?income:0);
   totalTransactional+=transactional;totalRenewal+=renewal;
   rows.push({year,transactional,renewal,totalTransactional,totalRenewal,gap:renewal-transactional});
  }
  return rows;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={calculateScenario};
 else root.calculateScenario=calculateScenario;
})(typeof window!=='undefined'?window:globalThis);
