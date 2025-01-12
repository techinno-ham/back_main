// import { HttpService } from '@nestjs/axios';
// import { Injectable } from '@nestjs/common';
// import { AxiosResponse } from 'axios';

// @Injectable()
// export class SocialService {
//   private readonly accessToken = 'EAAgh16w5R2kBO5OUtQIldZAYZAKekhNhmSZAASC5vJ0eoeUA7kwgY3ZBKZCoaR1d1s6fMSXX45XXLEPOV92TNDSCAwAP8WQgFvG6CFseiPhpD0BNfXDmyPODBZAQq5CAmRCU1cJep9MHJdwQ8sFHohgYMny6OIzpHVMkWzuGHqf6sR7dL1bm59IzqRQrVNjONdImJUyq6gz9frsqnO6tPntZBmKucWqJgm6ZBugzUUb3yfLdRhtjEwHWWLktCSi9OQ0pdrpkrQZDZD';
//   private readonly accountId = '122096099684728923';

//   constructor(private readonly httpService: HttpService) {}

//   // Fetch DMs from Instagram
//   async fetchDMs(): Promise<any> {
//     const url = `https://graph.facebook.com/v16.0/${this.accountId}/conversations`;
//     try {
//       const response: AxiosResponse = await this.httpService
//         .get(url, {
//           params: {
//             access_token: this.accessToken,
//           },
//         })
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       console.error(
//         'Error fetching DMs:',
//         error.response?.data || error.message,
//       );
//       throw new Error('Failed to fetch DMs');
//     }
//   }

//   // Send a reply to a conversation
//   async sendReply(conversationId: string, message: string): Promise<any> {
//     const url = `https://graph.facebook.com/v16.0/${conversationId}/messages`;
//     try {
//       const response: AxiosResponse = await this.httpService
//         .post(url, {
//           message,
//           access_token: this.accessToken,
//         })
//         .toPromise();
//       return response.data;
//     } catch (error) {
//       console.error(
//         'Error sending reply:',
//         error.response?.data || error.message,
//       );
//       throw new Error('Failed to send reply');
//     }
//   }
// }
