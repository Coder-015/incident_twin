import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const AttackGraph = ({ simulationState }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!simulationState) return;

        const width = 800;
        const height = 500;

        // Data Preparation
        const nodes = [];
        const links = [];
        const nodeSet = new Set();
        const addNode = (id, label, type, prob) => {
            if (!nodeSet.has(id)) {
                nodes.push({ id, label, type, prob });
                nodeSet.add(id);
            }
        };

        // History
        simulationState.history.forEach((techId, i) => {
            addNode(techId, techId, "history", 1.0);
            if (i > 0) links.push({ source: simulationState.history[i - 1], target: techId, type: "solid" });
        });

        // Current
        const current = simulationState.current_technique;
        addNode(current.id, current.name, "current", 1.0);
        if (simulationState.history.length > 0) {
            const last = simulationState.history[simulationState.history.length - 2];
            // Note: history includes current, so last is length-2 if length > 1
            if (simulationState.history.length > 1) {
                links.push({ source: simulationState.history[simulationState.history.length - 2], target: current.id, type: "solid" });
            }
        }

        // Predictions
        simulationState.next_possible_stages.forEach(pred => {
            addNode(pred.technique_id, pred.technique_name, "predicted", pred.probability);
            links.push({ source: current.id, target: pred.technique_id, type: "dashed", prob: pred.probability });
        });

        // D3 Setup
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous

        // Definitions for Glow
        const defs = svg.append("defs");
        const filter = defs.append("filter").attr("id", "glow");
        filter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX().x(d => {
                if (d.type === 'history') return width * 0.2;
                if (d.type === 'current') return width * 0.5;
                return width * 0.8;
            }).strength(0.8));

        // Draw Links
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", d => d.type === 'dashed' ? "#00f0ff" : "#05ffa1")
            .attr("stroke-width", d => d.prob ? d.prob * 3 : 2)
            .attr("stroke-opacity", d => d.type === 'dashed' ? 0.4 : 0.8)
            .attr("stroke-dasharray", d => d.type === 'dashed' ? "5,5" : "0");

        // Draw Nodes
        const node = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Outer Glow Circle (for Current)
        node.filter(d => d.type === 'current')
            .append("circle")
            .attr("r", 25)
            .attr("fill", "none")
            .attr("stroke", "#ff2a6d")
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.5)
            .style("filter", "url(#glow)")
            .append("animate")
            .attr("attributeName", "r")
            .attr("values", "25;35;25")
            .attr("dur", "2s")
            .attr("repeatCount", "indefinite");

        // Main Circle
        node.append("circle")
            .attr("r", d => d.type === 'current' ? 12 : 8)
            .attr("fill", d => {
                if (d.type === 'current') return "#ff2a6d";
                if (d.type === 'history') return "#05ffa1";
                return "#0f172a"; // dark for predicted
            })
            .attr("stroke", d => {
                if (d.type === 'current') return "#fff";
                if (d.type === 'predicted') return "#00f0ff";
                return "none";
            })
            .attr("stroke-width", 2)
            .style("filter", "url(#glow)");

        // Labels
        node.append("text")
            .text(d => d.label)
            .attr("x", 20)
            .attr("y", 5)
            .attr("font-family", "Space Mono")
            .attr("font-size", "10px")
            .attr("fill", "#e2e8f0")
            .style("text-shadow", "0 0 5px rgba(0,0,0,0.8)");

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

    }, [simulationState]);

    return (
        <div className="w-full h-full glass-panel rounded-2xl overflow-hidden relative">
            <div className="absolute top-4 left-6 z-10">
                <h3 className="text-cyber-blue font-display tracking-widest text-sm">GRAPH_VISUALIZATION // D3_FORCE</h3>
            </div>
            <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 500" className="w-full h-full"></svg>
        </div>
    );
};

export default AttackGraph;
