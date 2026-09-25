PACKED_PIPES_LIMIT = 16

class PackedPipes_AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False

anytype = PackedPipes_AnyType("*")

class PackedPipes_PackerNode:
    CATEGORY = "utils"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {}
        }

    RETURN_TYPES = ("PACKED_PIPE",)
    FUNCTION = "pack"

    def pack(self, **inputs):
        packed_pipe = inputs
        return (packed_pipe,)

class PackedPipes_UnpackerNode:
    CATEGORY = "utils"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "packed_pipe": ("PACKED_PIPE", {}),
            }
        }

    RETURN_TYPES = (anytype,) * PACKED_PIPES_LIMIT
    RETURN_NAMES = tuple(
        f"output_{i}" for i in range(PACKED_PIPES_LIMIT)
    )
    FUNCTION = "unpack"

    def unpack(self, packed_pipe):
        return tuple(
            packed_pipe.get(f"input_{i}")
            for i in range(PACKED_PIPES_LIMIT)
        )
