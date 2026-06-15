/**
 * A pure, standalone utility function to handle all ticket filtering.
 * This guarantees that React re-renders do not interrupt the search logic.
 */
export function applyTicketFilters(tickets, searchQuery, filterStatus, filterPriority) {
  // If the API hasn't loaded tickets yet, return an empty array safely
  if (!tickets || !Array.isArray(tickets)) return [];

  // Convert search text to lowercase safely
  const query = (searchQuery || '').toLowerCase().trim();

  return tickets.filter(ticket => {
    // 1. EXTRACT IDs (Match the UI default fallbacks exactly)
    // If a database row has a null priority, the UI paints it as "Low" (1). 
    // We must force the search engine to do the exact same thing.
    const pIdNum = Number(ticket.priorityid || ticket.PriorityId) || 1;
    const sIdNum = Number(ticket.statusid || ticket.StatusId) || 1;

    // 2. TRANSLATE TO WORDS FOR SEARCH BAR
    const pName = (pIdNum === 4 ? 'critical' : pIdNum === 3 ? 'high' : pIdNum === 2 ? 'medium' : 'low');
    const sName = (sIdNum === 2 ? 'in progress' : sIdNum === 3 ? 'resolved' : sIdNum === 4 ? 'closed' : sIdNum === 5 ? 'pending' : 'open');

    // 3. PREPARE STANDARD TEXT FIELDS
    const tNum = String(ticket.referenceno || ticket.TicketNumber || `tkt-00${ticket.id}`).toLowerCase();
    const title = String(ticket.title || '').toLowerCase();
    const catName = String(ticket.category_name || '').toLowerCase();
    const creator = String(ticket.creator_name || '').toLowerCase();

    // 4. PERFORM THE TEXT SEARCH
    const matchesSearch = !query || 
      tNum.includes(query) || 
      title.includes(query) || 
      catName.includes(query) || 
      creator.includes(query) || 
      pName.includes(query) || 
      sName.includes(query);

    // 5. PERFORM THE DROPDOWN MATCHES
    const matchesDropdownStatus = !filterStatus || String(sIdNum) === String(filterStatus);
    const matchesDropdownPriority = !filterPriority || String(pIdNum) === String(filterPriority);

    // 6. TICKET MUST PASS ALL ACTIVE FILTERS
    return matchesSearch && matchesDropdownStatus && matchesDropdownPriority;
  });
}