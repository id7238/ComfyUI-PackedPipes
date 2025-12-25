from .packed_pipes import PackedPipes_PackerNode, PackedPipes_UnpackerNode

NODE_CLASS_MAPPINGS = {
    "PipePacker": PackedPipes_PackerNode,
    "PipeUnpacker": PackedPipes_UnpackerNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PipePacker": "Pipe Packer",
    "PipeUnpacker": "Pipe Unpacker"
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
