import React, { useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { auth0 } from './lib/auth0'
import TruSdkReactNative from '@tru_id/tru-sdk-react-native'

const baseURL = '{YOUR_NGROK_URL}'

const createSIMCheck = async (phoneNumber) => {
  const body = { phone_number: phoneNumber }

  console.log('tru.ID: Creating SIMCheck for', body)

  const response = await fetch(`${baseURL}/sim-check`, {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = await response.json()

  return json
}

const App = () => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const errorHandler = ({ title, message }) => {
    return Alert.alert(title, message, [
      {
        text: 'Close',
        onPress: () => console.log('Alert closed'),
      },
    ])
  }

  const successHandler = () => {
    Alert.alert('Login Successful', '✅', [
      {
        text: 'Close',
        onPress: () => console.log('Alert closed'),
      },
    ])
  }

  const loginHandler = async () => {
    setLoading(true)
  
    try {
      const reachabilityResponse = await TruSdkReactNative.openWithDataCellular(
        'https://eu.api.tru.id/public/coverage/v0.1/device_ip'
      );
  
      console.log(reachabilityResponse);
      let isMNOSupported = false
  
      if ('error' in reachabilityResponse) {
        errorHandler({
          title: 'Something went wrong.',
          message: 'MNO not supported',
        })
        setLoading(false)
  
        return
      } else if ('http_status' in reachabilityResponse) {
        let httpStatus = reachabilityResponse.http_status;
        if (httpStatus === 200 && reachabilityResponse.response_body !== undefined) {
          let body = reachabilityResponse.response_body;
          console.log('product => ' + JSON.stringify(body.products[0]));
          isMNOSupported = true;
        } else if (httpStatus === 400 || httpStatus === 412 || reachabilityResponse.response_body !== undefined) {
          errorHandler({
            title: 'Something went wrong.',
            message: 'MNO not supported',
          })
          setLoading(false)
  
          return
        }
      }
  
      let isSimCheckSupported = false
  
      if (isMNOSupported === true) {
        reachabilityResponse.response_body.products.forEach((product) => {
          console.log('supported products are', product)
  
          if (product.product_name === 'Sim Check') {
            isSimCheckSupported = true
          }
        })
      }
  
      // If the SIMCheck API is supported, proceed with SIMCheck verification
      if (isSimCheckSupported) {
        // SIM hasn't changed within 7 days, proceed with Auth
        const data = await createSIMCheck(phoneNumber)

        console.log(data.no_sim_change);
        if (data.no_sim_change !== true) {
          setLoading(false)
      
          return errorHandler({
            title: 'Something went wrong',
            message: 'SIM changed too recently. Please contact support.',
          })
        } else {
          try {
            await auth0.auth.passwordlessWithSMS({
              phoneNumber,
            })
    
            setOtpSent(true)
            setLoading(false)
          } catch (e) {
            console.log(JSON.stringify(e))
            setLoading(false)
    
            return errorHandler({
              title: 'Something went wrong',
              message: e.message,
            })
          }
        }
      } else {
        // We don't support SIMCheck so just proceed with Auth0
        try {
          await auth0.auth.passwordlessWithSMS({
            phoneNumber,
          })
  
          setOtpSent(true)
          setLoading(false)
        } catch (e) {
          setLoading(false)
  
          return errorHandler({
            title: 'Something went wrong',
            message: e.message,
          })
        }
      }
    } catch (e) {
      setLoading(false)
      errorHandler({ title: 'Something went wrong', message: e.message })
    }
  }

  const otpHandler = async () => {
    try {
      const result = await auth0.auth.loginWithSMS({
        phoneNumber: phoneNumber,
        code,
      })
  
      if (result) {
        setLoading(false)
        return successHandler()
      }
    } catch (e) {
      console.log(JSON.stringify(e))
      setLoading(false)

      return errorHandler({
        title: 'Something went wrong',
        message: e.message,
      })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image style={styles.logo} source={require('./images/tru-logo.png')} />
        {otpSent === false ? (
          <View style={styles.content}>
            <Text style={styles.heading}>Login</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Number ex. +448023432345"
              placeholderTextColor="#d3d3d3"
              keyboardType="phone-pad"
              value={phoneNumber}
              editable={!loading}
              onChangeText={(value) => setPhoneNumber(value.replace(/\s+/g, ''))}
            />
  
            {loading ? (
              <ActivityIndicator
                style={styles.spinner}
                size="large"
                color="#00ff00"
              />
            ) : (
              <TouchableOpacity onPress={loginHandler} style={styles.button}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.heading}>Enter OTP</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter OTP Code"
              placeholderTextColor="#d3d3d3"
              keyboardType="default"
              value={code}
              editable={!loading}
              onChangeText={(value) => setCode(value.replace(/\s+/g, ''))}
            />
            {loading ? (
              <ActivityIndicator
                style={styles.spinner}
                size="large"
                color="#00ff00"
              />
            ) : (
              <TouchableOpacity onPress={otpHandler} style={styles.button}>
                <Text style={styles.buttonText}>Submit code</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginTop: 10,
    width: 0.5 * Dimensions.get('window').width,
    height: 200,
  },
  heading: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    padding: 15,
    borderRadius: 3,
    backgroundColor: '#fff',
    borderColor: '#858585',
    borderWidth: 0.4,
    elevation: 7,
    marginBottom: 10,
    shadowColor: '#858585',
    shadowOffset: { width: 0.5, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
    color: '#000',
    width: 0.7 * Dimensions.get('window').width,
  },
  spinner: {
    marginTop: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1955ff',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1955ff',
    marginTop: 17,
    width: 0.35 * Dimensions.get('window').width,
  },
  buttonText: {
    color: '#fff',
  },
})

export default App
