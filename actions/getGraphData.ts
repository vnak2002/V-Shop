import prisma from "@/libs/prismadb";
import moment from "moment";

export default async function getGraphData() {
  try {
    // Get the start and end dates for the data range (7 days ago to today)
    const startDate = moment().subtract(6, "days").startOf("day");
    const endDate = moment().endOf("day");

    //Query the database to get order data grouped by createDate
    const result = await prisma.order.groupBy({
      by: ["createDate"],
      where: {
        createDate: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString(),
        },
        status: "complete",
      },
      _sum: {
        amount: true,
      },
    });

    //Initialize the object to aggregate the data by date
    const aggregatedData: {
      [day: string]: { day: string; date: string; totalAmount: number };
    } = {};

    //create the clone of the start date to iterate over each day
    const currentDate = startDate.clone();

    //iterate over each day in data range
    while (currentDate <= endDate) {
      //formate the day as a string
      const day = currentDate.format("dddd");
      console.log("day<<<", day, currentDate);

      //Initialize the aggregatedData for the day with the day, date and total amount
      aggregatedData[day] = {
        day,
        date: currentDate.format("YYYY-MM-DD"),
        totalAmount: 0,
      };

      // move to the next day
      currentDate.add(1, "day");
    }

    // Calculate the total amount for each day by summing the order amount
    result.forEach((entry) => {
      const day = moment(entry.createDate).format("dddd");
      const amount = entry._sum.amount || 0;
      aggregatedData[day].totalAmount += amount;
    });

    // Convert the aggregatedData object to an array and sort it by date
    const formattedData = Object.values(aggregatedData).sort((a, b) =>
      moment(a.date).diff(moment(b.date))
    );

    // return the formatted Data
    return formattedData;
  } catch (error: any) {
    throw new Error(error);
  }
}
