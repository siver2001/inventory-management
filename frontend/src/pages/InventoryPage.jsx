// Thay thế dòng này:
// import { useSpareParts } from './useSpareParts'; 

// Bằng dòng này:
import { useInventory } from '../hooks/useInventory'; 

// Sau đó, thay thế tất cả các lần gọi hook:
// const { parts, savePart, deletePart, summary, PART_CATEGORIES: categories, generateQrCode, recordStockMovement } = useSpareParts(); 
// Bằng:
const { parts, savePart, deletePart, summary, PART_CATEGORIES: categories, generateQrCode, recordStockMovement } = useInventory();