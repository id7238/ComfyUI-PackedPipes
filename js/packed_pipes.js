import { app } from "../../scripts/app.js";

const PACKER_NODE_TYPE = 'PipePacker';
const PACKER_NODE_INPUTS_LIMIT = 16;
const PACKER_SYNC_BUTTON_CAPTION = "Sync Unpackers";
const UNPACKER_NODE_TYPE = 'PipeUnpacker';
const PACKED_PIPE_TYPE = 'PACKED_PIPE';
const PACKED_PIPE_TYPE_COLOR = '#8b008b';
const REROUTE_NODE_TYPE = 'Reroute';
const NODE_DEFAULT_WIDTH = 180;

class PackedPipesNode {

    constructor(node) {
        this.node = node;
    }

    static getSubgraphNodesMap() {
        const subgraphsParentNodesMap = new Map();

        const buildSubgraphsNodesMap = (graph) => {
            if (graph.nodes && graph.nodes.length > 0) {
                const subgraphNodes = graph.nodes.filter((node) => node.isSubgraphNode());
                subgraphNodes.forEach((subgraphNode) => {
                    subgraphsParentNodesMap.set(subgraphNode.subgraph.id, subgraphNode);
                    buildSubgraphsNodesMap(subgraphNode.subgraph);
                });
            }
        }

        buildSubgraphsNodesMap(app.graph);

        return subgraphsParentNodesMap;
    }

    static getInputNode(node, slot, subgraphNodes = PackedPipesNode.getSubgraphNodesMap()) {
        const pathElements = [];
        const getOriginNode = (graph, link) => {
            if (link) {
                const originNode = graph.getNodeById(link.origin_id);
                if (originNode && !originNode.isSubgraphNode()) {
                    pathElements.push({link: link, slot: originNode.outputs[link.origin_slot]});
                    if (originNode.type === REROUTE_NODE_TYPE) {
                        // Uncomment to change the Rerouter's input slot data type.
                        //pathElements.push({link: link, slot: originNode.inputs[0]});
                        return getOriginNode(originNode.graph, graph.getLink(originNode.inputs[0].link));
                    }
                    return {node: originNode, slot: link.origin_slot, path: pathElements};
                } else if (!originNode && link.origin_id === graph.inputNode?.id) {
                    const parentSubgraphNode = subgraphNodes.get(graph.id);
                    const linkId = parentSubgraphNode.inputs[link.origin_slot].link;
                    const subgraphLink = parentSubgraphNode.graph.getLink(linkId);
                    if (subgraphLink) {
                        pathElements.push({link: link, slot: graph.inputs[link.origin_slot]});
                        pathElements.push({link: subgraphLink, slot: parentSubgraphNode.inputs[link.origin_slot]});
                        return getOriginNode(parentSubgraphNode.graph, subgraphLink);
                    }
                } else if (originNode && originNode.isSubgraphNode()) {
                    const linkId = originNode.subgraph.outputs[link.origin_slot].linkIds[0];
                    const subgraphLink = originNode.subgraph.getLink(linkId);
                    pathElements.push({link: link, slot: originNode.outputs[link.origin_slot]});
                    pathElements.push({link: subgraphLink, slot: originNode.subgraph.outputs[link.origin_slot]});
                    return getOriginNode(originNode.subgraph, subgraphLink);
                }
            }
        }

        return getOriginNode(node.graph, node.graph?.getLink(node.inputs[slot].link), node.inputs[slot]);
    }

    static getOutputNodes(node, slot, subgraphNodes = PackedPipesNode.getSubgraphNodesMap()) {
        const result = [];

        const getTargetNodes = (graph, link) => {
            const targetNode = graph.getNodeById(link.target_id);
            if (targetNode && !targetNode.isSubgraphNode()) {
                result.push({node: targetNode, link: link});
            } else if (!targetNode && link.target_id === graph.outputNode?.id) {
                const parentSubgraphNode = subgraphNodes.get(graph.id);
                parentSubgraphNode.outputs[link.target_slot].links?.forEach(linkId => {
                    getTargetNodes(parentSubgraphNode.graph, parentSubgraphNode.graph.getLink(linkId));
                });
            } else if (targetNode && targetNode.isSubgraphNode()) {
                targetNode.subgraph.inputs[link.target_slot].linkIds.forEach(linkId => {
                    getTargetNodes(targetNode.subgraph, targetNode.subgraph.getLink(linkId));
                });
            }
        }

        node.outputs[slot]?.links?.forEach(linkId => {
            const link = node.graph.getLink(linkId);
            getTargetNodes(node.graph, link);
        });

        return result;
    }
}

class PackerNode extends PackedPipesNode {

    refresh() {
        if (this.node.inputs.length < PACKER_NODE_INPUTS_LIMIT
            && (this.node.inputs.length === 0
                || this.node.inputs[this.node.inputs.length - 1].link
                || this.node.inputs[this.node.inputs.length - 1].type !== '*'
            )
        ) {
            this.node.addInput(`input`, "*", {label: " "});
            this.node.inputs.forEach((input, inputIndex) => input.name = `input_${inputIndex}`);
        }
        if (this.node.widgets) {
            this.node.widgets[0].hidden = this.node.inputs.length <= 1 || this.node.findOutputSlotFree(0) === 0;
            if (this.node.widgets[0].hidden) {
                this.node.widgets[0].name = PACKER_SYNC_BUTTON_CAPTION;
            }
        }
        this.node.size[1] = this.node.computeSize()[1];
    }

    updateInput(slot) {
        const originNode = PackedPipesNode.getInputNode(this.node, slot);
        if (originNode?.node) {
            const originOutput = originNode.node.outputs[originNode.slot];
            this.node.inputs[slot].type = originOutput.type;
            this.node.inputs[slot].label = originOutput.label || originOutput.name || originOutput.type;
            this.node.inputs[slot].removable = true;
            originNode.path.forEach(pathElement => pathElement.link.type = pathElement.slot.type = originOutput.type);
        }
    }

    /**
     * @returns {UnpackerNode[]}
     */
    getUnpackers() {
        const unpackers = [];
        const subgraphNodes = PackedPipesNode.getSubgraphNodesMap();

        const findUnpackers = (node, slot, nextPackersSlots = []) => {
            PackedPipesNode.getOutputNodes(node, slot, subgraphNodes).forEach(nextNode => {
                if (nextNode.node.type === PACKER_NODE_TYPE) {
                    nextNode.node.inputs[nextNode.link.target_slot].label = this.node.outputs[0].label||this.node.outputs[0].type;
                    findUnpackers(nextNode.node, 0, [nextNode.link.target_slot, ...nextPackersSlots]);
                } else if (nextNode.node.type === UNPACKER_NODE_TYPE) {
                    if (nextPackersSlots.length > 0 && nextNode.node.outputs[nextPackersSlots[0]]?.type === PACKED_PIPE_TYPE) {
                        findUnpackers(nextNode.node, nextPackersSlots[0], nextPackersSlots.slice(1));
                    } else {
                        nextNode.node.inputs[0].label = this.node.outputs[0].label||this.node.outputs[0].type;
                        unpackers.push(new UnpackerNode(nextNode.node));
                    }
                } else {
                    findUnpackers(nextNode.node, nextNode.link.target_slot, nextPackersSlots);
                }
            });
        }

        findUnpackers(this.node, 0);

        return unpackers;
    }
}

class UnpackerNode extends PackedPipesNode {

    updateOutputs(packerNode = this.getPacker()) {
        if (!packerNode) {
            this.node.outputs.forEach(output => {
                if (output.label.substr(-1) !== '?') {
                    output.label += ' ?';
                }
            });
            return;
        }
        while (this.node.outputs.length > packerNode.inputs.length - 1) {
            this.node.removeOutput(this.node.outputs.length - 1);
        }
        for (let index = 0; index <= packerNode.inputs.length - 2; index++) {
            const packerInput = packerNode.inputs[index];
            const unpackerOutput = this.node.outputs[index];
            if (!unpackerOutput) {
                this.node.addOutput(`output_${index}`, packerInput.type, {label: packerInput.label || packerInput.name});
            } else {
                if (packerInput.type !== unpackerOutput.type) {
                    this.node.disconnectOutput(index);
                    unpackerOutput.type = packerInput.type;
                }
                unpackerOutput.label = packerInput.label;
            }
        }
        this.node.inputs[0].label = packerNode.outputs[0].label||packerNode.outputs[0].type;
        this.node.size[1] = this.node.computeSize()[1];
    }

    getPacker() {
        const skipPackers = [];
        const subgraphNodes = PackedPipesNode.getSubgraphNodesMap();

        const findOriginPacker = (node, slot, pathElements = []) => {
            let origin = PackedPipesNode.getInputNode(node, slot, subgraphNodes);
            if (origin?.node) {
                pathElements.push(...origin.path);
                if (origin.node.type === PACKER_NODE_TYPE) {
                    if (skipPackers.length === 0) {
                        pathElements.forEach(path => path.link.type = path.slot.type = PACKED_PIPE_TYPE);
                        return origin.node;
                    } else {
                        return findOriginPacker(origin.node, skipPackers.shift(), pathElements);
                    }
                } else if (origin.node.type === UNPACKER_NODE_TYPE) {
                    skipPackers.push(origin.slot);
                    return findOriginPacker(origin.node, 0, pathElements);
                } else if (origin.node.type === REROUTE_NODE_TYPE) {
                    return findOriginPacker(origin.node, 0, pathElements);
                }
            }
        }

        return findOriginPacker(this.node, 0);
    }
}

app.registerExtension({
    name: "ComfyUI.PackedPipes",

    async afterConfigureGraph() {
        app.canvas.default_connection_color_byType[PACKED_PIPE_TYPE] = PACKED_PIPE_TYPE_COLOR;
        LGraphCanvas.link_type_colors[PACKED_PIPE_TYPE] = PACKED_PIPE_TYPE_COLOR;
    },

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === UNPACKER_NODE_TYPE) {
            nodeData.output_is_list = [];
            nodeData.output_name = [];
            nodeData.output = [];
        }
    },

    loadedGraphNode(node) {
        if (node.type === PACKER_NODE_TYPE) {
            const packerNode = new PackerNode(node);
            packerNode.refresh();
        }
    },

    async nodeCreated(node) {

        if (node.comfyClass === PACKER_NODE_TYPE) {
            const packerNode = new PackerNode(node);

            const onAdded = node.onAdded;
            node.onAdded = function() {
                onAdded?.apply(this, arguments);
                node.addWidget("button", PACKER_SYNC_BUTTON_CAPTION, null, function () {
                    const unpackers = packerNode.getUnpackers();
                    unpackers.forEach(unpackerNode => unpackerNode.updateOutputs(this.node));
                    this.name = `${PACKER_SYNC_BUTTON_CAPTION} (${unpackers.length})`;
                }, {serialize: false});
                node.widgets[0].hidden = true;
                this.size[0] = NODE_DEFAULT_WIDTH;
                if (!app.configuringGraph) {
                    packerNode.refresh();
                }
            }
            const originalOnChange = node.onConnectionsChange;
            node.onConnectionsChange = function(side, slot, connect, link) {
                originalOnChange?.apply(this, arguments);
                if (!app.configuringGraph) {
                    if (side === LiteGraph.INPUT && connect && link) {
                        packerNode.updateInput(slot);
                    }
                    packerNode.refresh();
                }
            }
            const removeInput = node.removeInput;
            node.removeInput = function(slot) {
                const result = removeInput?.apply(this, arguments);
                packerNode.refresh(this);
                return result;
            }

        } else if (node.comfyClass === UNPACKER_NODE_TYPE) {
            const unpackerNode = new UnpackerNode(node);

            const onAdded = node.onAdded;
            node.onAdded = function() {
                onAdded?.apply(this, arguments);
                this.size[0] = NODE_DEFAULT_WIDTH;
            }
            const onConnectionsChange = node.onConnectionsChange;
            node.onConnectionsChange = function(side, slot, connect, link) {
                onConnectionsChange?.apply(this, arguments);
                if (!app.configuringGraph && side === LiteGraph.INPUT && connect) {
                    unpackerNode.updateOutputs();
                }
            }
        }
    }
});
