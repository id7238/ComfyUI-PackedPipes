# ComfyUI-PackedPipes

![ComfyUI-PackedPipes](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/logo.png)

A set of custom nodes that keeps ComfyUI workflows tidy by combining multiple links into a single pipeline link. This extension adds two nodes, `Pipe Packer` and `Pipe Unpacker`, to the `utils` category.

* `Pipe Packer` accepts up to 16 connections of any type.
* `Pipe Unpacker` restores the inputs of its connected `Pipe Packer` as outputs, in the same order.
* Supports rerouters and subgraphs.
* `Pipe Packer` supports custom input port labels ("Keep input names" option).
* Supports nesting: a packed pipe can be connected to another `Pipe Packer`.
* When an input port is connected, the `Pipe Unpacker` node automatically synchronizes with its `Pipe Packer` node.

> [!NOTE]
> Renaming and removing `Pipe Packer` input ports is not available in Nodes 2.0 — ComfyUI does not expose these options in the new UI. To rename or remove a port, temporarily disable Nodes 2.0.

## Installation

Clone this repository into the `custom_nodes` folder of your ComfyUI installation:
```
git clone https://github.com/id7238/ComfyUI-PackedPipes.git
```

## Examples

### 1. Usage example

![](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/workflow_example1.png)

### 2. An example of nested Packers and Unpackers

![](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/workflow_example2.png)

### 3. A complex example

An example based on the Wan 2.2 14B I2V template, adapted to sequence multiple scenes into a video longer than 5 seconds. The last frame of each scene is passed to the next scene as the first image. Duplicate the second scene's subgraph to add more scenes; any unused scene can be bypassed.

[Download the workflow](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/workflows/video_wan2_2_14B_i2v_sequence.json)

![](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/workflow_example3-0.png)
[Setup subgraph](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/workflow_example3-1-setup.png)
| [First scene subgraph](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/workflow_example3-2-scene1.png)
| [Second and subsequent scenes subgraph](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/workflow_example3-3-scene2.png)
| [Create Video subgraph](https://raw.githubusercontent.com/id7238/ComfyUI-PackedPipes/docs/assets/images/workflow_example3-4-create_video.png)


