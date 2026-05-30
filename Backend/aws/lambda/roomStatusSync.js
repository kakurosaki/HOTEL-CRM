import { syncAllRoomStatuses } from "../../src/utils/roomStatusAutomation.js";

export const handler = async () => {
  const result = await syncAllRoomStatuses();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Room status sync completed",
      updatedCount: result.updatedCount,
    }),
  };
};