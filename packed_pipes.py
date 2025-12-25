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
    
    RETURN_TYPES = (anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype, anytype)
    RETURN_NAMES = ("output_0", "output_1", "output_2", "output_3", "output_4", "output_5", "output_6", "output_7", "output_8", "output_9", "output_10", "output_11", "output_12", "output_13", "output_14", "output_15")
    FUNCTION = "unpack"

    def unpack(self, packed_pipe):
        return tuple(packed_pipe.values())
