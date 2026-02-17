class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next


class LinkedList:
    def __init__(self, values=None):
        """
        Initialize the linked list.
        If a list of values is provided, create nodes for them.
        """
        self.head = None

        if values:
            # Build the list from back to front
            for value in reversed(values):
                self.head = Node(value, self.head)

    def visualize(self):
        """
        Print a visual representation of the linked list.
        """
        current = self.head
        parts = []

        while current:
            parts.append(f"[ {current.value} ]")
            current = current.next

        print(" -> ".join(parts) + " -> None")

    def to_list(self):
        """
        Convert the linked list into a Python list (for debugging/testing).
        """
        result = []
        current = self.head

        while current:
            result.append(current.value)
            current = current.next

        return result

    def insert_at(self, index, value):
        """
        Insert a new node with `value` at position `index`.
        """
        new_node = Node(value)

        # Case 1: insert at head
        if index == 0:
            new_node.next = self.head
            self.head = new_node
            return

        # Traverse to the node BEFORE the insertion point
        current = self.head
        current_position = 0

        while current and current_position < index - 1:
            current = current.next
            current_position += 1

        if not current:
            raise IndexError("Index out of bounds")

        # Insert the new node
        new_node.next = current.next
        current.next = new_node


# -------------------------
# Quick manual test
# -------------------------
if __name__ == "__main__":
    ll = LinkedList([1, 2, 3])
    print("Initial list:", ll.to_list())

    ll.insert_at(1, 99)
    print("After insert:", ll.to_list())

    ll.insert_at(0, 42)
    print("After insert at head:", ll.to_list())

    ll.visualize()

