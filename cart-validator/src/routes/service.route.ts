//@ts-nocheck
import express, { Router } from 'express';
import axios from 'axios';
import cors from 'cors';

const serviceRouter = Router();
serviceRouter.use(cors());
serviceRouter.use(express.json());

serviceRouter.post('/', async (req, res) => {
  const getToken = async () => {
    const authUrl = process.env.CTP_AUTH_URL;
    const clientId = process.env.CTP_CLIENT_ID;
    const clientSecret = process.env.CTP_CLIENT_SECRET;
    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'client_credentials');

    const response = await axios.post(`${authUrl}/oauth/token`, bodyParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
    });

    if (response.status !== 200) {
      console.log('getToken.error', { data: response.data });
      return;
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        let access_tokens = response.data.access_token;
        resolve(access_tokens);
      }, 1000);
    });
  };

  var acccesstoken = await getToken();

  const sku = req.body.sku;
  const BEARERTOKEN = acccesstoken;
  const countQuantity = req.body.countQuantity;

  try {
    const response = await axios.get(
      `https://poc-changecx.frontastic.io/frontastic/action/product/getProduct?sku=${sku}`,
      {
        headers: {
          Authorization: `Bearer ${BEARERTOKEN}`,
        },
      }
    );

    if (response.status === 200) {
      const product = response.data;
      let minOrderQuantity = 1;
      let maxOrderQuantity = 10;

      if (product?.variants && product?.variants?.length > 0) {
        product?.variants.forEach((variant: any) => {
          const { minorderqty, maxorderqty } = variant?.attributes || {};
          minOrderQuantity = minorderqty;
          if (maxorderqty !== undefined) {
            maxOrderQuantity = maxorderqty;
          }
        });

        if (countQuantity > maxOrderQuantity) {
          res.json('exceed the limit');
        } else {
          res.json('not exceed');
        }
      }
    } else {
      res.status(response.status).json({ error: response.statusText });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default serviceRouter;
