import React, { useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";

const defaultMatrix = [
  [0, 1, 1, 1],
  [1, 0, 1, 1],
  [1, 1, 0, 1],
  [1, 1, 1, 0],
];

const GraphVisualizer = () => {
  const [numVertices, setNumVertices] = useState(4);
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkedNodes, setLinkedNodes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [matrixVisible, setMatrixVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(true);
  const [dijkstraMode, setDijkstraMode] = useState(false);
  const [dijkstraStart, setDijkstraStart] = useState(null);
  const [dijkstraGoal, setDijkstraGoal] = useState(null);
  const [shortestPathVertices, setShortestPathVertices] = useState([]);
  const [shortestPathEdges, setShortestPathEdges] = useState(new Set());

  useEffect(() => {
    setNodes(matrix.map((_, i) => ({ id: i })));
    resetSelections();
  }, [matrix.length]);

  const createEmptyMatrix = size => Array.from({ length: size }, () => Array(size).fill(0));

  const isGraphComplete = () => matrix.every((row, i) => row.every((cell, j) => (i === j ? cell === 0 : cell === 1)));

  const countEdges = () => matrix.reduce((sum, row, i) => sum + row.slice(i + 1).filter(v => v === 1).length, 0);

  const makeCompleteGraph = () => {
    const newM = matrix.map((row, i) => row.map((_, j) => (i === j ? 0 : 1)));
    setMatrix(newM);
    if (selectedNode != null) {
      const linked = newM[selectedNode.id].map((v, k) => (v ? k : null)).filter(x => x != null);
      setLinkedNodes(linked);
    }
  };

  const handleNumVerticesChange = e => {
    const v = +e.target.value;
    if (v > 0) {
      setMatrix(createEmptyMatrix(v));
      setNumVertices(v);
    }
  };

  const computeShortestPath = (start, goal) => {
    const n = matrix.length;
    const queue = [start];
    const visited = Array(n).fill(false);
    const prev = Array(n).fill(null);
    visited[start] = true;
    while (queue.length) {
      const v = queue.shift();
      if (v === goal) break;
      matrix[v].forEach((e, i) => {
        if (e && !visited[i]) {
          visited[i] = true;
          prev[i] = v;
          queue.push(i);
        }
      });
    }
    if (!visited[goal]) return [];
    const path = [];
    for (let at = goal; at != null; at = prev[at]) path.push(at);
    return path.reverse();
  };

  const handleDijkstraCompletion = (s, g) => {
    const path = computeShortestPath(s, g);
    setShortestPathVertices(path);
    const edges = new Set();
    path.forEach((v, i) => {
      if (i < path.length - 1) {
        const a = v, b = path[i + 1];
        edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
      }
    });
    setShortestPathEdges(edges);
  };

  const handleNodeClick = node => {
    if (editMode) {
      if (!linkMode) {
        setSelectedNode(node);
        setLinkedNodes([]);
      } else {
        if (linkedNodes.includes(node.id)) {
          setLinkedNodes(ln => ln.filter(x => x !== node.id));
          updateMatrix(selectedNode.id, node.id, 0);
        } else {
          setLinkedNodes(ln => [...ln, node.id]);
          updateMatrix(selectedNode.id, node.id, 1);
        }
      }
      return;
    }
    if (dijkstraMode) {
      if (dijkstraStart == null) setDijkstraStart(node.id);
      else if (dijkstraGoal == null && node.id !== dijkstraStart) {
        setDijkstraGoal(node.id);
        handleDijkstraCompletion(dijkstraStart, node.id);
      }
      return;
    }
    setSelectedNode(node);
  };

  const updateMatrix = (i, j, val) => {
    setMatrix(m => m.map((r, ri) => r.map((c, ci) => ((ri === i && ci === j) || (ri === j && ci === i) ? val : c))));
  };

  const toggleEditMode = () => {
    if (editMode) resetSelections();
    setEditMode(em => !em);
  };

  const resetSelections = () => {
    setSelectedNode(null);
    setLinkMode(false);
    setLinkedNodes([]);
    if (dijkstraMode) {
      setDijkstraMode(false);
      setDijkstraStart(null);
      setDijkstraGoal(null);
      setShortestPathVertices([]);
      setShortestPathEdges(new Set());
    }
  };

  const handleToggleLinkMode = () => {
    if (!linkMode && selectedNode != null) {
      const linked = matrix[selectedNode.id].map((v, idx) => (v ? idx : null)).filter(x => x != null);
      setLinkedNodes(linked);
    } else setLinkedNodes([]);
    setLinkMode(l => !l);
  };

  const toggleDijkstraMode = () => {
    if (dijkstraMode) {
      setDijkstraMode(false);
      setDijkstraStart(null);
      setDijkstraGoal(null);
      setShortestPathVertices([]);
      setShortestPathEdges(new Set());
    } else {
      resetSelections();
      setDijkstraMode(true);
    }
  };

  const handleShuffle = () => {
    setNodes(nds => nds.map(n => ({ ...n, x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400 })));
  };

  const graphData = { nodes, links: matrix.flatMap((r, i) => r.map((v, j) => (j > i && v ? { source: i, target: j } : null))).filter(x => x) };
  const getConn = id => matrix[id].map((v, i) => (v ? i : null)).filter(x => x != null);

  const styles = {
    container: { display: 'flex', height: '100vh', fontFamily: 'Segoe UI', background: '#f0f2f5', overflow: 'hidden' },
    sidebar: { width: '280px', padding: '1rem', background: '#fff', borderRight: '1px solid #ddd', boxShadow: '2px 0 8px rgba(0,0,0,0.1)', flexShrink: 0 },
    heading: { margin: '0 0 1rem', color: '#333' },
    btn: { width: '100%', height: '36px', margin: '8px 0', border: 'none', borderRadius: '4px', background: '#007bff', color: '#fff', cursor: 'pointer' },
    overlay: { position: 'absolute', bottom: '10px', right: '10px', width: '25vw', height: '25vw', maxWidth: '200px', maxHeight: '200px', background: '#fff', border: '1px solid #ccc', overflow: 'auto' },
    infoBox: { position: 'absolute', top: '50px', right: '10px', width: '200px', background: '#fff', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
    diceBtn: { position: 'absolute', bottom: '10px', left: '10px', width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: '#007bff', color: '#fff', fontSize: '24px', cursor: 'pointer' },
    toggleInfoBtn: { position: 'absolute', top: '10px', right: '10px', width: '36px', height: '36px', borderRadius: '4px', border: 'none', background: '#6c757d', color: '#fff', cursor: 'pointer' },
  };

  return (
    <div style={{ ...styles.container, position: 'relative' }}>
      <div style={styles.sidebar}>
        <h3 style={styles.heading}>Configurazione</h3>
        <button style={styles.btn} onClick={toggleEditMode}>{editMode ? 'Esci da Edit Mode' : 'Entra in Edit Mode'}</button>
        {editMode ? (
          <> 
            <label>Num vertici: {numVertices}</label>
            <input type='range' min='1' max='10' value={numVertices} onChange={handleNumVerticesChange} style={{ width: '100%' }} />
            {selectedNode && <div style={styles.info}><strong>Selezionato:</strong> {selectedNode.id}<button style={{ ...styles.btn, background: '#6c757d' }} onClick={handleToggleLinkMode}>{linkMode ? 'Termina Col.' : 'Collega'}</button></div>}
            {!isGraphComplete() && <button style={styles.btn} onClick={makeCompleteGraph}>Rendi completo</button>}
          </>
        ) : (
          <>
            <button style={styles.btn} onClick={() => setMatrixVisible(v => !v)}>{matrixVisible ? 'Nascondi Matrice' : 'Mostra Matrice'}</button>
            <button style={styles.btn} onClick={toggleDijkstraMode}>{dijkstraMode ? 'Annulla DIJKSTRA' : 'DIJKSTRA'}</button>
          </>
        )}
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ForceGraph2D style={{ width: '100%', height: '100%' }} graphData={graphData}
          linkColor={link => { const a = typeof link.source === 'object' ? link.source.id : link.source; const b = typeof link.target === 'object' ? link.target.id : link.target; const key = `${Math.min(a, b)}-${Math.max(a, b)}`; return shortestPathEdges.has(key) && !editMode ? '#f39c12' : '#999'; }}
          linkWidth={link => { const a = typeof link.source === 'object' ? link.source.id : link.source; const b = typeof link.target === 'object' ? link.target.id : link.target; const key = `${Math.min(a, b)}-${Math.max(a, b)}`; return shortestPathEdges.has(key) && !editMode ? 3 : 1; }}
          nodeCanvasObject={(node, ctx, gs) => { const { id } = node; let color = '#e74c3c', size = 6, stroke = null, sw = 0; if (editMode) { if (selectedNode?.id === id) { color = '#3498db'; size = 6.5; } else if (linkMode && linkedNodes.includes(id)) { color = '#2ecc71'; } } else if (dijkstraMode && shortestPathVertices.length === 0) { if (id === dijkstraStart || id === dijkstraGoal) { color = '#8e44ad'; stroke = '#8e44ad'; sw = 1; } } else if (shortestPathVertices.includes(id)) { color = '#f1c40f'; if (id === dijkstraStart || id === dijkstraGoal) { stroke = '#8e44ad'; sw = 1; } } ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false); ctx.fillStyle = color; ctx.fill(); if (stroke) { ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.stroke(); } ctx.font = `${12 / gs}px Sans-Serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2c3e50'; ctx.fillText(id, node.x, node.y - size - 2); }}
          onNodeClick={handleNodeClick}
        />
        <button style={styles.diceBtn} onClick={handleShuffle}>🎲</button>
        <button style={styles.toggleInfoBtn} onClick={() => setInfoVisible(v => !v)}>ℹ️</button>
        {infoVisible && <div style={styles.infoBox}><p><strong>Vertices:</strong> {matrix.length}</p><p><strong>Edges:</strong> {countEdges()}</p><p><strong>Complete:</strong> {isGraphComplete() ? 'Yes' : 'No'}</p></div>}
        {matrixVisible && <div style={styles.overlay}><table style={{ borderCollapse: 'collapse', width: '100%', height: '100%' }}><tbody>{matrix.map((r, i) => (<tr key={i}>{r.map((c, j) => (<td key={j} style={{ border: '1px solid #ccc', padding: '2px', textAlign: 'center' }}>{c}</td>))}</tr>))}</tbody></table></div>}
      </div>
    </div>
  );
};

export default GraphVisualizer;
